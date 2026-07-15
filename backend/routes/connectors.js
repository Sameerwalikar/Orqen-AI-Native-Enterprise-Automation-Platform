const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const connectorService = require('../services/connectorService');

const router = express.Router();
const prisma = new PrismaClient();

// Get available connector types
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const types = connectorService.getAvailableConnectorTypes();
    res.status(200).json({
      success: true,
      data: { types },
    });
  } catch (error) {
    console.error('Get connector types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connector types',
    });
  }
});

// List connectors
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, status } = req.query;

    const where = {
      userId,
      ...(type && { type }),
      ...(status && { status }),
    };

    const connectors = await prisma.connector.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Remove sensitive config data from response
    const safeConnectors = connectors.map(connector => ({
      ...connector,
      config: {}, // Don't expose config in list
    }));

    res.status(200).json({
      success: true,
      data: { connectors: safeConnectors },
    });
  } catch (error) {
    console.error('List connectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connectors',
    });
  }
});

// Get single connector
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const connector = await prisma.connector.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!connector) {
      return res.status(404).json({
        success: false,
        message: 'Connector not found',
      });
    }

    // Don't expose full config, just metadata
    const safeConnector = {
      ...connector,
      config: {}, // Config is encrypted and sensitive
    };

    res.status(200).json({
      success: true,
      data: { connector: safeConnector },
    });
  } catch (error) {
    console.error('Get connector error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connector',
    });
  }
});

// Create connector
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, type, config, organizationId } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required',
      });
    }

    // Encrypt sensitive config
    const encryptedConfig = connectorService.encryptConfig(config || {});

    const connector = await prisma.connector.create({
      data: {
        name,
        type,
        userId,
        organizationId,
        config: encryptedConfig,
        status: 'ACTIVE',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Connector created successfully',
      data: { connector: { ...connector, config: {} } },
    });
  } catch (error) {
    console.error('Create connector error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create connector',
    });
  }
});

// Update connector
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, config, status } = req.body;

    const existingConnector = await prisma.connector.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingConnector) {
      return res.status(404).json({
        success: false,
        message: 'Connector not found',
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (config) {
      // Encrypt sensitive config
      updateData.config = connectorService.encryptConfig(config);
    }

    const updatedConnector = await prisma.connector.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Connector updated successfully',
      data: { connector: { ...updatedConnector, config: {} } },
    });
  } catch (error) {
    console.error('Update connector error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update connector',
    });
  }
});

// Delete connector
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existingConnector = await prisma.connector.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingConnector) {
      return res.status(404).json({
        success: false,
        message: 'Connector not found',
      });
    }

    await prisma.connector.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Connector deleted successfully',
    });
  } catch (error) {
    console.error('Delete connector error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete connector',
    });
  }
});

// Test connector
router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await connectorService.testConnector(id, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Test connector error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to test connector',
    });
  }
});

module.exports = router;

