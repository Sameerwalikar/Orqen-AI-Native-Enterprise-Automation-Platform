const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const schedulerService = require('../services/scheduler/SchedulerService');

const router = express.Router();
const prisma = new PrismaClient();

// List webhooks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { resourceType, resourceId, enabled } = req.query;

    const where = {
      userId,
      ...(resourceType && { resourceType }),
      ...(resourceId && { resourceId }),
      ...(enabled !== undefined && { enabled: enabled === 'true' }),
    };

    const webhooks = await prisma.webhook.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: { webhooks },
    });
  } catch (error) {
    console.error('List webhooks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch webhooks',
    });
  }
});

// Get single webhook
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const webhook = await prisma.webhook.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { webhook },
    });
  } catch (error) {
    console.error('Get webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch webhook',
    });
  }
});

// Create webhook
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, resourceType, resourceId, organizationId } = req.body;

    if (!name || !resourceType || !resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Name, resourceType, and resourceId are required',
      });
    }

    // Generate unique webhook URL
    const webhookId = require('crypto').randomUUID();
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    const url = `${baseUrl}/api/webhooks/trigger/${webhookId}`;

    // Generate secret
    const secret = schedulerService.generateWebhookSecret();

    const webhook = await prisma.webhook.create({
      data: {
        name,
        resourceType,
        resourceId,
        userId,
        organizationId,
        url,
        secret,
        enabled: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Webhook created successfully',
      data: { webhook },
    });
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create webhook',
    });
  }
});

// Update webhook
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, enabled, regenerateSecret } = req.body;

    const existingWebhook = await prisma.webhook.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingWebhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found',
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (regenerateSecret) {
      updateData.secret = schedulerService.generateWebhookSecret();
    }

    const updatedWebhook = await prisma.webhook.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Webhook updated successfully',
      data: { webhook: updatedWebhook },
    });
  } catch (error) {
    console.error('Update webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update webhook',
    });
  }
});

// Delete webhook
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existingWebhook = await prisma.webhook.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingWebhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found',
      });
    }

    await prisma.webhook.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete webhook',
    });
  }
});

// Webhook trigger endpoint (public, no auth required)
router.post('/trigger/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const signature = req.headers['x-webhook-signature'] || req.headers['x-signature'];
    const payload = req.body;

    await schedulerService.handleWebhook(id, payload, signature);

    res.status(200).json({
      success: true,
      message: 'Webhook triggered successfully',
    });
  } catch (error) {
    console.error('Webhook trigger error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to trigger webhook',
    });
  }
});

module.exports = router;

