const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const schedulerService = require('../services/scheduler/SchedulerService');

const router = express.Router();
const prisma = new PrismaClient();

// List schedules
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

    const schedules = await prisma.schedule.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: { schedules },
    });
  } catch (error) {
    console.error('List schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedules',
    });
  }
});

// Get single schedule
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const schedule = await prisma.schedule.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { schedule },
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedule',
    });
  }
});

// Create schedule
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, resourceType, resourceId, cronExpression, timezone, enabled, organizationId } = req.body;

    if (!name || !resourceType || !resourceId || !cronExpression) {
      return res.status(400).json({
        success: false,
        message: 'Name, resourceType, resourceId, and cronExpression are required',
      });
    }

    // Validate cron expression
    const cron = require('node-cron');
    if (!cron.validate(cronExpression)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cron expression',
      });
    }

    // Calculate next run time
    const parser = require('cron-parser');
    const interval = parser.parseExpression(cronExpression, {
      tz: timezone || 'UTC',
    });
    const nextRun = interval.next().toDate();

    const schedule = await prisma.schedule.create({
      data: {
        name,
        resourceType,
        resourceId,
        userId,
        organizationId,
        cronExpression,
        timezone: timezone || 'UTC',
        enabled: enabled !== undefined ? enabled : true,
        nextRun,
      },
    });

    // Reload schedules to include new one
    await schedulerService.loadSchedules();

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: { schedule },
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create schedule',
    });
  }
});

// Update schedule
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, cronExpression, timezone, enabled } = req.body;

    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (timezone) updateData.timezone = timezone;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (cronExpression) {
      // Validate cron expression
      const cron = require('node-cron');
      if (!cron.validate(cronExpression)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cron expression',
        });
      }
      updateData.cronExpression = cronExpression;
      
      // Recalculate next run
      const parser = require('cron-parser');
      const interval = parser.parseExpression(cronExpression, {
        tz: timezone || existingSchedule.timezone,
      });
      updateData.nextRun = interval.next().toDate();
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { id },
      data: updateData,
    });

    // Reload schedules
    await schedulerService.loadSchedules();

    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: { schedule: updatedSchedule },
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update schedule',
    });
  }
});

// Delete schedule
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    // Stop the job
    schedulerService.stopSchedule(id);

    await prisma.schedule.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete schedule',
    });
  }
});

module.exports = router;

