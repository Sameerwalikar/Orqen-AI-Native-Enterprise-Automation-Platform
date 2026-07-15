const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const webSocketService = require('../websocket');

class AnalyticsService {
  /**
   * Record execution metric
   */
  async recordMetric(data) {
    try {
      const metric = await prisma.executionMetric.create({
        data: {
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          executionId: data.executionId,
          userId: data.userId,
          organizationId: data.organizationId,
          duration: data.duration || 0,
          memoryUsage: data.memoryUsage,
          cpuUsage: data.cpuUsage,
          apiCalls: data.apiCalls || 0,
          tokensUsed: data.tokensUsed,
          cost: data.cost,
          status: data.status,
          errorType: data.errorType,
        },
      });

      // Update daily usage analytics
      await this.updateDailyUsage(data.userId, data.organizationId, data);

      // Emit WebSocket update
      webSocketService.emitMetricUpdate({
        ...data,
        timestamp: new Date().toISOString(),
      });

      return metric;
    } catch (error) {
      console.error('Error recording metric:', error);
      // Don't throw - metrics should not break execution
    }
  }

  /**
   * Update daily usage analytics
   */
  async updateDailyUsage(userId, organizationId, metricData) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const where = organizationId
        ? { organizationId, date: today }
        : { userId, date: today };

      const updateData = {
        apiCalls: { increment: metricData.apiCalls || 0 },
        tokensUsed: { increment: metricData.tokensUsed || 0 },
        cost: { increment: metricData.cost || 0 },
      };

      // Increment resource-specific counters
      if (metricData.resourceType === 'agent') {
        updateData.agentsExecuted = { increment: 1 };
      } else if (metricData.resourceType === 'workflow') {
        updateData.workflowsExecuted = { increment: 1 };
      } else if (metricData.resourceType === 'pipeline') {
        updateData.pipelinesExecuted = { increment: 1 };
      }

      await prisma.usageAnalytics.upsert({
        where: organizationId
          ? { organizationId_date: { organizationId, date: today } }
          : { userId_date: { userId, date: today } },
        update: updateData,
        create: {
          userId: organizationId ? null : userId,
          organizationId,
          date: today,
          ...updateData,
        },
      });
    } catch (error) {
      console.error('Error updating daily usage:', error);
    }
  }

  /**
   * Get metrics overview
   */
  async getOverview(userId, organizationId = null, startDate, endDate) {
    const where = {
      ...(organizationId ? { organizationId } : { userId }),
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [totalExecutions, successfulExecutions, failedExecutions, totalCost, totalTokens] =
      await Promise.all([
        prisma.executionMetric.count({ where }),
        prisma.executionMetric.count({
          where: { ...where, status: 'COMPLETED' },
        }),
        prisma.executionMetric.count({
          where: { ...where, status: 'FAILED' },
        }),
        prisma.executionMetric.aggregate({
          where,
          _sum: { cost: true },
        }),
        prisma.executionMetric.aggregate({
          where,
          _sum: { tokensUsed: true },
        }),
      ]);

    const avgDuration = await prisma.executionMetric.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _avg: { duration: true },
    });

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      totalCost: totalCost._sum.cost || 0,
      totalTokens: totalTokens._sum.tokensUsed || 0,
      avgDuration: avgDuration._avg.duration || 0,
    };
  }

  /**
   * Get usage trends
   */
  async getUsageTrends(userId, organizationId = null, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const where = organizationId
      ? { organizationId, date: { gte: startDate } }
      : { userId, date: { gte: startDate } };

    const analytics = await prisma.usageAnalytics.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return analytics.map((a) => ({
      date: a.date,
      agentsExecuted: a.agentsExecuted,
      workflowsExecuted: a.workflowsExecuted,
      pipelinesExecuted: a.pipelinesExecuted,
      apiCalls: a.apiCalls,
      tokensUsed: a.tokensUsed,
      cost: a.cost,
    }));
  }

  /**
   * Get resource breakdown
   */
  async getResourceBreakdown(userId, organizationId = null, startDate, endDate) {
    const where = {
      ...(organizationId ? { organizationId } : { userId }),
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [agents, workflows, pipelines] = await Promise.all([
      prisma.executionMetric.count({
        where: { ...where, resourceType: 'agent' },
      }),
      prisma.executionMetric.count({
        where: { ...where, resourceType: 'workflow' },
      }),
      prisma.executionMetric.count({
        where: { ...where, resourceType: 'pipeline' },
      }),
    ]);

    return {
      agents,
      workflows,
      pipelines,
      total: agents + workflows + pipelines,
    };
  }

  /**
   * Get error analysis
   */
  async getErrorAnalysis(userId, organizationId = null, startDate, endDate) {
    const where = {
      ...(organizationId ? { organizationId } : { userId }),
      status: 'FAILED',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const errors = await prisma.executionMetric.groupBy({
      by: ['errorType'],
      where,
      _count: { id: true },
    });

    return errors.map((e) => ({
      errorType: e.errorType || 'Unknown',
      count: e._count.id,
    }));
  }

  /**
   * Calculate cost for execution
   */
  calculateCost(tokensUsed, model = 'gpt-4') {
    // OpenAI pricing (per 1K tokens)
    const pricing = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    };

    const modelPricing = pricing[model] || pricing['gpt-4'];
    // Assume 70% input, 30% output
    const inputTokens = tokensUsed * 0.7;
    const outputTokens = tokensUsed * 0.3;
    const cost = (inputTokens / 1000) * modelPricing.input + (outputTokens / 1000) * modelPricing.output;

    return cost;
  }
}

module.exports = new AnalyticsService();

