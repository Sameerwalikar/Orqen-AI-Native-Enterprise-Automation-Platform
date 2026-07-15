const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const pipelineEngine = require('../services/pipelineEngine');

const router = express.Router();
const prisma = new PrismaClient();

// ==================== PIPELINES ====================

// Get all pipelines for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, organizationId } = req.query;

    const where = {
      userId,
      ...(status && { status }),
      ...(organizationId && { organizationId }),
    };

    const pipelines = await prisma.pipeline.findMany({
      where,
      include: {
        _count: {
          select: {
            runs: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: { pipelines },
    });
  } catch (error) {
    console.error('Get pipelines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pipelines',
    });
  }
});

// Get a single pipeline
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const pipeline = await prisma.pipeline.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        runs: {
          take: 10,
          orderBy: {
            startedAt: 'desc',
          },
        },
        _count: {
          select: {
            runs: true,
          },
        },
      },
    });

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { pipeline },
    });
  } catch (error) {
    console.error('Get pipeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pipeline',
    });
  }
});

// Create a new pipeline
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, definition, organizationId, status, schedule } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Pipeline name is required',
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Pipeline name must be at least 2 characters',
      });
    }

    // Default definition if not provided
    const defaultDefinition = definition || {
      steps: [],
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

    // Create pipeline
    const pipeline = await prisma.pipeline.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        definition: defaultDefinition,
        schedule: schedule || null,
        userId,
        organizationId: organizationId || null,
        status: status || 'DRAFT',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Pipeline created successfully',
      data: { pipeline },
    });
  } catch (error) {
    console.error('Create pipeline error:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A pipeline with this name already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create pipeline',
    });
  }
});

// Update a pipeline
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, description, definition, status, schedule } = req.body;

    // Check if pipeline exists and user owns it
    const existingPipeline = await prisma.pipeline.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingPipeline) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found',
      });
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Pipeline name must be at least 2 characters',
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

    if (schedule !== undefined) {
      updateData.schedule = schedule || null;
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

    // Update pipeline
    const pipeline = await prisma.pipeline.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Pipeline updated successfully',
      data: { pipeline },
    });
  } catch (error) {
    console.error('Update pipeline error:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update pipeline',
    });
  }
});

// Delete a pipeline
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if pipeline exists and user owns it
    const existingPipeline = await prisma.pipeline.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingPipeline) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found',
      });
    }

    // Delete pipeline (cascade will delete runs)
    await prisma.pipeline.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Pipeline deleted successfully',
    });
  } catch (error) {
    console.error('Delete pipeline error:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete pipeline',
    });
  }
});

// Execute a pipeline
router.post('/:id/execute', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { input } = req.body;

    // Find pipeline
    const pipeline = await prisma.pipeline.findFirst({
      where: {
        id,
        userId,
        status: 'ACTIVE', // Only execute active pipelines
      },
    });

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found or not active',
      });
    }

    // Create execution record
    const execution = await prisma.pipelineRun.create({
      data: {
        pipelineId: id,
        userId,
        status: 'PENDING',
        input: input || {},
      },
    });

    // Update status to RUNNING
    await prisma.pipelineRun.update({
      where: { id: execution.id },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    // Execute pipeline asynchronously
    pipelineEngine
      .execute(id, input || {}, userId)
      .then(async (result) => {
        await prisma.pipelineRun.update({
          where: { id: execution.id },
          data: {
            status: result.success ? 'COMPLETED' : 'FAILED',
            output: result.output,
            error: result.error,
            logs: JSON.stringify(result.logs),
            recordsProcessed: result.recordsProcessed,
            completedAt: new Date(),
            duration: Date.now() - execution.startedAt.getTime(),
          },
        });
      })
      .catch(async (error) => {
        await prisma.pipelineRun.update({
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
      message: 'Pipeline execution started',
      data: { execution },
    });
  } catch (error) {
    console.error('Execute pipeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute pipeline',
    });
  }
});

// Get pipeline runs
router.get('/:id/runs', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { limit = 20, offset = 0, status } = req.query;

    // Verify pipeline belongs to user
    const pipeline = await prisma.pipeline.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found',
      });
    }

    // Get runs
    const where = {
      pipelineId: id,
      userId,
      ...(status && { status }),
    };

    const [runs, total] = await Promise.all([
      prisma.pipelineRun.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: {
          startedAt: 'desc',
        },
      }),
      prisma.pipelineRun.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        runs,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + runs.length < total,
        },
      },
    });
  } catch (error) {
    console.error('Get runs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch runs',
    });
  }
});

// Get available connectors
router.get('/connectors/available', authenticateToken, async (req, res) => {
  try {
    const connectors = pipelineEngine.getAvailableConnectors();

    res.status(200).json({
      success: true,
      data: { connectors },
    });
  } catch (error) {
    console.error('Get connectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connectors',
    });
  }
});

module.exports = router;

