const express = require('express');
const { googleOAuth, slackOAuth } = require('../middleware/oauth');
const { PrismaClient } = require('@prisma/client');
const connectorService = require('../services/connectorService');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Google OAuth - Initiate
 */
router.get('/google/authorize', async (req, res) => {
  try {
    const { connectorType, userId, connectorId } = req.query;

    if (!connectorType || !userId) {
      return res.status(400).json({
        success: false,
        message: 'connectorType and userId are required',
      });
    }

    const authUrl = googleOAuth.getAuthUrl(connectorType, userId, connectorId);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth authorize error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate OAuth',
    });
  }
});

/**
 * Google OAuth - Callback
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: 'Missing code or state',
      });
    }

    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId, connectorType, connectorId } = stateData;

    // Get tokens
    const tokens = await googleOAuth.getTokens(code);

    // Encrypt tokens
    const encryptedConfig = connectorService.encryptConfig(tokens);

    if (connectorId) {
      // Update existing connector
      await prisma.connector.update({
        where: { id: connectorId },
        data: {
          config: encryptedConfig,
          status: 'ACTIVE',
        },
      });
    } else {
      // Create new connector
      await prisma.connector.create({
        data: {
          name: `${connectorType} Connector`,
          type: connectorType,
          userId: parseInt(userId),
          config: encryptedConfig,
          status: 'ACTIVE',
        },
      });
    }

    // Redirect to frontend success page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    res.redirect(`${frontendUrl}/connectors?oauth=success&type=${connectorType}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    res.redirect(`${frontendUrl}/connectors?oauth=error&message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Slack OAuth - Initiate
 */
router.get('/slack/authorize', async (req, res) => {
  try {
    const { userId, connectorId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    const authUrl = slackOAuth.getAuthUrl(userId, connectorId);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Slack OAuth authorize error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate OAuth',
    });
  }
});

/**
 * Slack OAuth - Callback
 */
router.get('/slack/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: 'Missing code or state',
      });
    }

    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId, connectorId } = stateData;

    // Get tokens
    const tokens = await slackOAuth.getTokens(code);

    // Encrypt tokens
    const encryptedConfig = connectorService.encryptConfig(tokens);

    if (connectorId) {
      // Update existing connector
      await prisma.connector.update({
        where: { id: connectorId },
        data: {
          config: encryptedConfig,
          status: 'ACTIVE',
        },
      });
    } else {
      // Create new connector
      await prisma.connector.create({
        data: {
          name: 'Slack Connector',
          type: 'slack',
          userId: parseInt(userId),
          config: encryptedConfig,
          status: 'ACTIVE',
        },
      });
    }

    // Redirect to frontend success page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    res.redirect(`${frontendUrl}/connectors?oauth=success&type=slack`);
  } catch (error) {
    console.error('Slack OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    res.redirect(`${frontendUrl}/connectors?oauth=error&message=${encodeURIComponent(error.message)}`);
  }
});

module.exports = router;

