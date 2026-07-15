const cron = require('node-cron');
const parser = require('cron-parser');
const { PrismaClient } = require('@prisma/client');
const workflowEngine = require('../workflowEngine');
const pipelineEngine = require('../pipelineEngine');
const crypto = require('crypto');

const prisma = new PrismaClient();

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
      const interval = parser.parseExpression(cronExpression, {
        tz: timezone,
      });
      return interval.next().toDate();
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
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  /**
   * Handle webhook trigger
   */
  async handleWebhook(webhookId, payload, signature) {
    try {
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId },
      });

      if (!webhook || !webhook.enabled) {
        throw new Error('Webhook not found or disabled');
      }

      // Verify signature if provided
      if (signature && webhook.secret) {
        const isValid = this.verifyWebhookSignature(payload, signature, webhook.secret);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      // Execute based on resource type
      if (webhook.resourceType === 'workflow') {
        await workflowEngine.execute(webhook.resourceId, payload, webhook.userId);
      } else if (webhook.resourceType === 'pipeline') {
        await pipelineEngine.execute(webhook.resourceId, payload, webhook.userId);
      }

      return { success: true };
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

