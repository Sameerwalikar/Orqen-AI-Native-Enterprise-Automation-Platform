const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { OAuth2Client } = require('google-auth-library');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Google OAuth client (used for verifying ID tokens from the frontend)
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

// Sign-up route
router.post('/sign-up', async (req, res) => {
  try {
    const { firstName, gmail, password } = req.body;

    // Validation
    if (!firstName || !gmail || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { gmail }
    });

    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        gmail,
        password: hashedPassword
      }
    });

    // Generate JWT token - 2 days session
    const token = jwt.sign(
      { userId: user.id, gmail: user.gmail },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '2d' }
    );

    // Set secure cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
      path: '/'
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          gmail: user.gmail,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Sign-up error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Sign-in route
router.post('/sign-in', async (req, res) => {
  try {
    const { gmail, password, rememberMe } = req.body;

    // Validation
    if (!gmail || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { gmail }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token - 2 days session, 30 days if remember me
    const expiresIn = rememberMe ? '30d' : '2d';
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 2 * 24 * 60 * 60 * 1000;
    
    const token = jwt.sign(
      { userId: user.id, gmail: user.gmail },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn }
    );

    // Set secure cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge,
      path: '/'
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          gmail: user.gmail,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Google Sign-in route
// Expects a Google ID token (credential) from the frontend and returns a JWT + user info
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!googleClient || !googleClientId) {
      return res.status(500).json({
        success: false,
        message: 'Google authentication is not configured on the server',
      });
    }

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required',
      });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Unable to verify Google account',
      });
    }

    const gmail = payload.email;
    const firstName =
      payload.given_name ||
      (payload.name ? payload.name.split(' ')[0] : gmail.split('@')[0]);
    const avatarUrl = payload.picture || null;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { gmail },
    });

    if (!user) {
      // Create a random password hash for Google-only accounts to satisfy schema
      const randomPassword = jwt.sign({ sub: payload.sub }, process.env.JWT_SECRET || 'your-secret-key');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          firstName,
          gmail,
          password: hashedPassword,
          avatarUrl,
        },
      });
    } else if (!user.avatarUrl && avatarUrl) {
      // Backfill avatar for existing users if we don't have one yet
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl },
      });
    }

    // Generate our own JWT token for the app - 2 days session
    const token = jwt.sign(
      { userId: user.id, gmail: user.gmail },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '2d' }
    );

    // Set secure cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
      path: '/'
    });

    return res.status(200).json({
      success: true,
      message: 'Google sign-in successful',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          gmail: user.gmail,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Google sign-in error:', error);

    // Sample token verification error response
    if (error.message && error.message.toLowerCase().includes('token')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Google token',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate with Google. Please try again.',
    });
  }
});

// Update user profile route (Protected)
router.put('/update-profile', authenticateToken, async (req, res) => {
  try {
    const { firstName } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!firstName || firstName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'First name is required and cannot be empty'
      });
    }

    // Validate firstName length
    if (firstName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'First name must be at least 2 characters long'
      });
    }

    if (firstName.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: 'First name must be less than 50 characters'
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName.trim()
      },
      select: {
        id: true,
        firstName: true,
        gmail: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          gmail: updatedUser.gmail,
          avatarUrl: updatedUser.avatarUrl,
          createdAt: updatedUser.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile. Please try again.'
    });
  }
});

// Logout route
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/'
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        firstName: true,
        gmail: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
