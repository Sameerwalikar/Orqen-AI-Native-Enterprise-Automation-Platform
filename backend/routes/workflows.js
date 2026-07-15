const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const workflowEngine = require('../services/workflowEngine');

const router = express.Router();
const prisma = new PrismaClient();

// ==================== WORKFLOWS ====================

// Get all workflows for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, organizationId } = req.query;

    const where = {
      userId,
      ...(status && { status }),
      ...(organizationId && { organizationId }),
    };

    const workflows = await prisma.workflow.findMany({
      where,
      include: {
        _count: {
          select: {
            executions: true,
            triggers: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: { workflows },
    });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflows',
    });
  }
});

// Get a single workflow
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        executions: {
          take: 10,
          orderBy: {
            startedAt: 'desc',
          },
        },
        triggers: true,
        _count: {
          select: {
            executions: true,
            triggers: true,
          },
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { workflow },
    });
  } catch (error) {
    console.error('Get workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow',
    });
  }
});

// Create a new workflow
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, definition, organizationId, status } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Workflow name is required',
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Workflow name must be at least 2 characters',
      });
    }

    // Default definition if not provided
    const defaultDefinition = definition || {
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          label: 'Start',
          position: { x: 100, y: 100 },
        },
        {
          id: 'end-1',
          type: 'end',
          label: 'End',
          position: { x: 300, y: 100 },
        },
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'start-1',
          target: 'end-1',
        },
      ],
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

    // Create workflow
    const workflow = await prisma.workflow.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        definition: defaultDefinition,
        userId,
        organizationId: organizationId || null,
        status: status || 'DRAFT',
        version: 1,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Workflow created successfully',
      data: { workflow },
    });
  } catch (error) {
    console.error('Create workflow error:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A workflow with this name and version already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create workflow',
    });
  }
});

// Update a workflow
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, description, definition, status } = req.body;

    // Check if workflow exists and user owns it
    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingWorkflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Workflow name must be at least 2 characters',
        });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (definition !== undefined) {
      updateData.definition = definition;
    }

    if (status !== undefined) {
      if (!['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be DRAFT, ACTIVE, PAUSED, or ARCHIVED',
        });
      }
      updateData.status = status;
    }

    // Update workflow
    const workflow = await prisma.workflow.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Workflow updated successfully',
      data: { workflow },
    });
  } catch (error) {
    console.error('Update workflow error:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update workflow',
    });
  }
});

// Delete a workflow
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if workflow exists and user owns it
    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingWorkflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    // Delete workflow (cascade will delete executions and triggers)
    await prisma.workflow.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Workflow deleted successfully',
    });
  } catch (error) {
    console.error('Delete workflow error:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete workflow',
    });
  }
});

// Execute a workflow
router.post('/:id/execute', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { input } = req.body;

    // Find workflow
    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        userId,
        status: 'ACTIVE', // Only execute active workflows
      },
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found or not active',
      });
    }

    // Create execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: id,
        userId,
        status: 'PENDING',
        input: input || {},
      },
    });

    // Execute workflow asynchronously
    workflowEngine
      .execute(id, input || {}, userId)
      .then(async (result) => {
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: result.success ? 'COMPLETED' : 'FAILED',
            output: result.output,
            error: result.error,
            logs: JSON.stringify(result.logs),
            completedAt: new Date(),
            duration: Date.now() - execution.startedAt.getTime(),
          },
        });
      })
      .catch(async (error) => {
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            error: error.message,
            completedAt: new Date(),
            duration: Date.now() - execution.startedAt.getTime(),
          },
        });
      });

    res.status(201).json({
      success: true,
      message: 'Workflow execution started',
      data: { execution },
    });
  } catch (error) {
    console.error('Execute workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute workflow',
    });
  }
});

// Get workflow executions
router.get('/:id/executions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { limit = 20, offset = 0, status } = req.query;

    // Verify workflow belongs to user
    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    // Get executions
    const where = {
      workflowId: id,
      userId,
      ...(status && { status }),
    };

    const [executions, total] = await Promise.all([
      prisma.workflowExecution.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: {
          startedAt: 'desc',
        },
      }),
      prisma.workflowExecution.count({ where }),
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

// ==================== TRIGGERS ====================

// Create a trigger
router.post('/:id/triggers', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { type, config, enabled } = req.body;

    // Verify workflow belongs to user
    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    // Validate trigger type
    if (!['MANUAL', 'SCHEDULE', 'WEBHOOK', 'EVENT'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trigger type',
      });
    }

    // Create trigger
    const trigger = await prisma.workflowTrigger.create({
      data: {
        workflowId: id,
        type,
        config: config || {},
        enabled: enabled !== undefined ? enabled : true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Trigger created successfully',
      data: { trigger },
    });
  } catch (error) {
    console.error('Create trigger error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create trigger',
    });
  }
});

// Update a trigger
router.put('/triggers/:triggerId', authenticateToken, async (req, res) => {
  try {
    const { triggerId } = req.params;
    const userId = req.user.userId;
    const { config, enabled } = req.body;

    // Verify trigger belongs to user's workflow
    const trigger = await prisma.workflowTrigger.findFirst({
      where: {
        id: triggerId,
        workflow: {
          userId,
        },
      },
    });

    if (!trigger) {
      return res.status(404).json({
        success: false,
        message: 'Trigger not found',
      });
    }

    // Update trigger
    const updateData = {};
    if (config !== undefined) {
      updateData.config = config;
    }
    if (enabled !== undefined) {
      updateData.enabled = enabled;
    }

    const updatedTrigger = await prisma.workflowTrigger.update({
      where: { id: triggerId },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Trigger updated successfully',
      data: { trigger: updatedTrigger },
    });
  } catch (error) {
    console.error('Update trigger error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trigger',
    });
  }
});

// Delete a trigger
router.delete('/triggers/:triggerId', authenticateToken, async (req, res) => {
  try {
    const { triggerId } = req.params;
    const userId = req.user.userId;

    // Verify trigger belongs to user's workflow
    const trigger = await prisma.workflowTrigger.findFirst({
      where: {
        id: triggerId,
        workflow: {
          userId,
        },
      },
    });

    if (!trigger) {
      return res.status(404).json({
        success: false,
        message: 'Trigger not found',
      });
    }

    // Delete trigger
    await prisma.workflowTrigger.delete({
      where: { id: triggerId },
    });

    res.status(200).json({
      success: true,
      message: 'Trigger deleted successfully',
    });
  } catch (error) {
    console.error('Delete trigger error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete trigger',
    });
  }
});

module.exports = router;

