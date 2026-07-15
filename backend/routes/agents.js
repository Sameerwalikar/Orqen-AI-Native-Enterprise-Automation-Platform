const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { executionQueue } = require('../services/agentExecutor');

const router = express.Router();
const prisma = new PrismaClient();

// Get all agents for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, organizationId } = req.query;

    // Build where clause
    const where = {
      userId,
      ...(status && { status }),
      ...(organizationId && { organizationId }),
    };

    const agents = await prisma.agent.findMany({
      where,
      include: {
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: { agents },
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agents',
    });
  }
});

// Get a single agent by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const agent = await prisma.agent.findFirst({
      where: {
        id,
        userId, // Ensure user owns the agent
      },
      include: {
        executions: {
          take: 10,
          orderBy: {
            startedAt: 'desc',
          },
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { agent },
    });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent',
    });
  }
});

// Create a new agent
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, config, code, organizationId, status } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Agent name is required',
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Agent name must be at least 2 characters',
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Agent name must be less than 100 characters',
      });
    }

    // Validate config if provided
    if (config && typeof config !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Config must be a valid JSON object',
      });
    }

    // Default config if not provided
    const defaultConfig = {
      type: 'llm',
      model: 'gpt-4',
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
    };

    // Check if organization exists and user has access (if organizationId provided)
    if (organizationId) {
      const orgUser = await prisma.organizationUser.findFirst({
        where: {
          organizationId,
          userId,
          role: {
            in: ['OWNER', 'ADMIN', 'MEMBER'],
          },
        },
      });

      if (!orgUser) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this organization',
        });
      }
    }

    // Create agent
    const agent = await prisma.agent.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        config: config || defaultConfig,
        code: code || null,
        userId,
        organizationId: organizationId || null,
        status: status || 'DRAFT',
        version: '1.0.0',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      data: { agent },
    });
  } catch (error) {
    console.error('Create agent error:', error);

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'An agent with this name and version already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create agent',
    });
  }
});

// Update an agent
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, description, config, code, status } = req.body;

    // Check if agent exists and user owns it
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingAgent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Agent name must be at least 2 characters',
        });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Agent name must be less than 100 characters',
        });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (config !== undefined) {
      if (typeof config !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Config must be a valid JSON object',
        });
      }
      updateData.config = config;
    }

    if (code !== undefined) {
      updateData.code = code || null;
    }

    if (status !== undefined) {
      if (!['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be DRAFT, ACTIVE, or ARCHIVED',
        });
      }
      updateData.status = status;
    }

    // Update agent
    const agent = await prisma.agent.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Agent updated successfully',
      data: { agent },
    });
  } catch (error) {
    console.error('Update agent error:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update agent',
    });
  }
});

// Delete an agent
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if agent exists and user owns it
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingAgent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    // Delete agent (cascade will delete executions)
    await prisma.agent.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    console.error('Delete agent error:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete agent',
    });
  }
});

// Execute an agent
router.post('/:id/execute', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { input } = req.body;

    // Find agent
    const agent = await prisma.agent.findFirst({
      where: {
        id,
        userId,
        status: 'ACTIVE', // Only execute active agents
      },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found or not active',
      });
    }

    // Create execution record
    const execution = await prisma.agentExecution.create({
      data: {
        agentId: id,
        userId,
        status: 'PENDING',
        input: input || {},
      },
    });

    // Queue execution for processing
    await executionQueue.add({
      executionId: execution.id,
      agentId: id,
      userId,
      input: input || {},
    });

    res.status(201).json({
      success: true,
      message: 'Agent execution queued',
      data: { execution },
    });
  } catch (error) {
    console.error('Execute agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute agent',
    });
  }
});

// Get agent executions
router.get('/:id/executions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { limit = 20, offset = 0, status } = req.query;

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    // Get executions
    const where = {
      agentId: id,
      userId,
      ...(status && { status }),
    };

    const [executions, total] = await Promise.all([
      prisma.agentExecution.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: {
          startedAt: 'desc',
        },
      }),
      prisma.agentExecution.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        executions,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + executions.length < total,
        },
      },
    });
  } catch (error) {
    console.error('Get executions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch executions',
    });
  }
});

module.exports = router;

