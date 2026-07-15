const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const analyticsService = require('../services/analytics/AnalyticsService');

const router = express.Router();
const prisma = new PrismaClient();

// Get analytics overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { organizationId, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const overview = await analyticsService.getOverview(userId, organizationId, start, end);

    res.status(200).json({
      success: true,
      data: { overview },
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics overview',
    });
  }
});

// Get usage trends
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { organizationId, days = 30 } = req.query;

    const trends = await analyticsService.getUsageTrends(userId, organizationId, parseInt(days));

    res.status(200).json({
      success: true,
      data: { trends },
    });
  } catch (error) {
    console.error('Get usage trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage trends',
    });
  }
});

// Get resource breakdown
router.get('/breakdown', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { organizationId, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const breakdown = await analyticsService.getResourceBreakdown(userId, organizationId, start, end);

    res.status(200).json({
      success: true,
      data: { breakdown },
    });
  } catch (error) {
    console.error('Get resource breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resource breakdown',
    });
  }
});

// Get error analysis
router.get('/errors', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { organizationId, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const errors = await analyticsService.getErrorAnalysis(userId, organizationId, start, end);

    res.status(200).json({
      success: true,
      data: { errors },
    });
  } catch (error) {
    console.error('Get error analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch error analysis',
    });
  }
});

// Get metrics (detailed)
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { organizationId, resourceType, resourceId, startDate, endDate, limit = 100 } = req.query;

    const where = {
      ...(organizationId ? { organizationId } : { userId }),
      ...(resourceType && { resourceType }),
      ...(resourceId && { resourceId }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    const metrics = await prisma.executionMetric.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      data: { metrics },
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics',
    });
  }
});

module.exports = router;

