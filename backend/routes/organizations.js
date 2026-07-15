const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// List user's organizations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const orgUsers = await prisma.organizationUser.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });

    const organizations = orgUsers.map((ou) => ({
      ...ou.organization,
      role: ou.role,
      joinedAt: ou.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: { organizations },
    });
  } catch (error) {
    console.error('List organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations',
    });
  }
});

// Create organization
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, slug } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    // Generate slug if not provided
    const orgSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    // Check if slug exists
    const existing = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Organization slug already exists',
      });
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name,
        slug: orgSlug,
        plan: 'FREE',
      },
    });

    // Add user as owner
    await prisma.organizationUser.create({
      data: {
        organizationId: organization.id,
        userId,
        role: 'OWNER',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: { organization },
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create organization',
    });
  }
});

// Get organization details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user is member
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId,
        },
      },
      include: {
        organization: true,
      },
    });

    if (!orgUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        organization: orgUser.organization,
        role: orgUser.role,
      },
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization',
    });
  }
});

// Update organization
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, plan } = req.body;

    // Check if user is owner or admin
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId,
        },
      },
    });

    if (!orgUser || (orgUser.role !== 'OWNER' && orgUser.role !== 'ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner or Admin role required.',
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (plan) updateData.plan = plan;

    const organization = await prisma.organization.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: { organization },
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization',
    });
  }
});

// Delete organization
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user is owner
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId,
        },
      },
    });

    if (!orgUser || orgUser.role !== 'OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner role required.',
      });
    }

    await prisma.organization.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Organization deleted successfully',
    });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete organization',
    });
  }
});

// List organization members
router.get('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user is member
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId,
        },
      },
    });

    if (!orgUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const members = await prisma.organizationUser.findMany({
      where: { organizationId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            gmail: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        members: members.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          joinedAt: m.createdAt,
          user: m.user,
        })),
      },
    });
  } catch (error) {
    console.error('List members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
    });
  }
});

// Add member to organization
router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { userEmail, role = 'MEMBER' } = req.body;

    // Check if user is owner or admin
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId,
        },
      },
    });

    if (!orgUser || (orgUser.role !== 'OWNER' && orgUser.role !== 'ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner or Admin role required.',
      });
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { gmail: userEmail },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already member
    const existing = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId: targetUser.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member',
      });
    }

    // Add member
    const member = await prisma.organizationUser.create({
      data: {
        organizationId: id,
        userId: targetUser.id,
        role,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: { member },
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add member',
    });
  }
});

// Update member role
router.put('/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const userId = req.user.userId;
    const { role } = req.body;

    // Check if user is owner or admin
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId,
        },
      },
    });

    if (!orgUser || (orgUser.role !== 'OWNER' && orgUser.role !== 'ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner or Admin role required.',
      });
    }

    // Prevent changing owner role
    if (role === 'OWNER' && orgUser.role !== 'OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Only owner can assign owner role',
      });
    }

    const member = await prisma.organizationUser.update({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId: parseInt(targetUserId),
        },
      },
      data: { role },
    });

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: { member },
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member role',
    });
  }
});

// Remove member from organization
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const userId = req.user.userId;

    // Check if user is owner or admin
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId,
        },
      },
    });

    if (!orgUser || (orgUser.role !== 'OWNER' && orgUser.role !== 'ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner or Admin role required.',
      });
    }

    // Prevent removing owner
    const targetMember = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId: parseInt(targetUserId),
        },
      },
    });

    if (targetMember && targetMember.role === 'OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove owner',
      });
    }

    await prisma.organizationUser.delete({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId: parseInt(targetUserId),
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member',
    });
  }
});

// Get organization resources
router.get('/:id/resources', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user is member
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId,
        },
      },
    });

    if (!orgUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const [agents, workflows, pipelines, connectors] = await Promise.all([
      prisma.agent.count({ where: { organizationId: id } }),
      prisma.workflow.count({ where: { organizationId: id } }),
      prisma.pipeline.count({ where: { organizationId: id } }),
      prisma.connector.count({ where: { organizationId: id } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        resources: {
          agents,
          workflows,
          pipelines,
          connectors,
        },
      },
    });
  } catch (error) {
    console.error('Get organization resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization resources',
    });
  }
});

module.exports = router;

