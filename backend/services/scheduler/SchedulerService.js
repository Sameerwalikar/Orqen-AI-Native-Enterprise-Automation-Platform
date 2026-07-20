const cron = require('node-cron');
const { getNextRun } = require('./cronValidation');
const prisma = require('../../lib/prisma');
const workflowEngine = require('../workflowEngine');
const pipelineEngine = require('../pipelineEngine');
const crypto = require('crypto');


class SchedulerService {
  constructor() {
    this.jobs = new Map(); // Store active cron jobs
    this.isRunning = false;
  }

  /**
   * Start the scheduler
   */
  async start() {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting scheduler service...');

    // Load all enabled schedules
    await this.loadSchedules();

    // Schedule periodic check for new/updated schedules
    setInterval(async () => {
      await this.loadSchedules();
    }, 60000); // Check every minute

    console.log('Scheduler service started');
  }

  /**
   * Load and schedule all enabled schedules
   */
  async loadSchedules() {
    try {
      const schedules = await prisma.schedule.findMany({
        where: {
          enabled: true,
        },
      });

      // Remove schedules that no longer exist or are disabled
      for (const [scheduleId, job] of this.jobs.entries()) {
        const exists = schedules.find(s => s.id === scheduleId);
        if (!exists) {
          job.destroy();
          this.jobs.delete(scheduleId);
        }
      }

      // Add/update schedules
      for (const schedule of schedules) {
        if (!this.jobs.has(schedule.id)) {
          await this.scheduleJob(schedule);
        } else {
          // Update next run time if changed
          await this.updateNextRun(schedule);
        }
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  }

  /**
   * Schedule a cron job
   */
  async scheduleJob(schedule) {
    try {
      // Validate cron expression
      if (!cron.validate(schedule.cronExpression)) {
        console.error(`Invalid cron expression for schedule ${schedule.id}: ${schedule.cronExpression}`);
        return;
      }

      // Calculate next run time
      const nextRun = this.calculateNextRun(schedule.cronExpression, schedule.timezone);
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: { nextRun },
      });

      // Create cron job
      const job = cron.schedule(
        schedule.cronExpression,
        async () => {
          await this.executeSchedule(schedule);
        },
        {
          scheduled: true,
          timezone: schedule.timezone || 'UTC',
        }
      );

      this.jobs.set(schedule.id, job);
      console.log(`Scheduled job for ${schedule.resourceType} ${schedule.resourceId}: ${schedule.cronExpression}`);
    } catch (error) {
      console.error(`Error scheduling job ${schedule.id}:`, error);
    }
  }

  /**
   * Calculate next run time from cron expression
   */
  calculateNextRun(cronExpression, timezone = 'UTC') {
    try {
      return getNextRun(cronExpression, timezone);
    } catch (error) {
      console.error('Error calculating next run:', error);
      return null;
    }
  }

  /**
   * Update next run time for a schedule
   */
  async updateNextRun(schedule) {
    const nextRun = this.calculateNextRun(schedule.cronExpression, schedule.timezone);
    if (nextRun) {
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: { nextRun },
      });
    }
  }

  /**
   * Execute a scheduled task
   */
  async executeSchedule(schedule) {
    console.log(`Executing schedule ${schedule.id} for ${schedule.resourceType} ${schedule.resourceId}`);

    try {
      // Update last run time
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: {
          lastRun: new Date(),
          nextRun: this.calculateNextRun(schedule.cronExpression, schedule.timezone),
        },
      });

      // Execute based on resource type
      if (schedule.resourceType === 'workflow') {
        await workflowEngine.execute(schedule.resourceId, {}, schedule.userId);
      } else if (schedule.resourceType === 'pipeline') {
        await pipelineEngine.execute(schedule.resourceId, {}, schedule.userId);
      }
    } catch (error) {
      console.error(`Error executing schedule ${schedule.id}:`, error);
    }
  }

  /**
   * Stop a specific schedule
   */
  stopSchedule(scheduleId) {
    const job = this.jobs.get(scheduleId);
    if (job) {
      job.destroy();
      this.jobs.delete(scheduleId);
    }
  }

  /**
   * Stop all schedules
   */
  stop() {
    for (const [scheduleId, job] of this.jobs.entries()) {
      job.destroy();
      this.jobs.delete(scheduleId);
    }
    this.isRunning = false;
    console.log('Scheduler service stopped');
  }

  /**
   * Generate webhook secret
   */
  generateWebhookSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(JSON.stringify(payload)).digest('hex');
    const received = Buffer.from(signature || '');
    const expected = Buffer.from(digest);
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
  }

  /**
   * Handle webhook trigger
   */
  async handleWebhook(webhookId, payload, signature) {
    try {
      // New hooks use the primary key in their URL. The URL fallback keeps hooks
      // created by the earlier, mismatched implementation triggerable.
      const webhook = await prisma.webhook.findFirst({
        where: { OR: [{ id: webhookId }, { url: { endsWith: `/trigger/${webhookId}` } }] },
      });

      if (!webhook || !webhook.enabled) {
        throw new Error('Webhook not found or disabled');
      }

      if (webhook.secret && !this.verifyWebhookSignature(payload, signature, webhook.secret)) {
        throw new Error('Invalid webhook signature');
      }

      // Execute based on resource type
      let execution;
      if (webhook.resourceType === 'workflow') {
        execution = await workflowEngine.execute(webhook.resourceId, payload, webhook.userId);
      } else if (webhook.resourceType === 'pipeline') {
        execution = await pipelineEngine.execute(webhook.resourceId, payload, webhook.userId);
      }

      return { success: true, execution };
    } catch (error) {
      console.error(`Error handling webhook ${webhookId}:`, error);
      throw error;
    }
  }
}

const schedulerService = new SchedulerService();

// Start scheduler when module loads
if (process.env.NODE_ENV !== 'test') {
  schedulerService.start().catch(console.error);
}

module.exports = schedulerService;

