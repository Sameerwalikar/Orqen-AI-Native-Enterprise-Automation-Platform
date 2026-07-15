const BaseConnector = require('../base/BaseConnector');
const { WebClient } = require('@slack/web-api');

/**
 * Slack Connector
 */
class SlackConnector extends BaseConnector {
  constructor(config = {}) {
    super(config);
    this.client = null;
    this.initializeSlack();
  }

  initializeSlack() {
    const token = this.config.access_token || this.config.bot_token;
    if (token) {
      this.client = new WebClient(token);
    }
  }

  async validateConfig() {
    const errors = [];
    if (!this.config.access_token && !this.config.bot_token) {
      errors.push('OAuth token is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async test() {
    try {
      await this.validateConfig();
      const authTest = await this.client.auth.test();
      return { success: true, message: `Slack connection successful (${authTest.team})` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async read(options = {}) {
    const { channel, limit = 10 } = options;
    const targetChannel = channel || this.config.defaultChannel;

    if (!targetChannel) {
      throw new Error('channel is required');
    }

    try {
      const response = await this.client.conversations.history({
        channel: targetChannel,
        limit,
      });

      return (response.messages || []).map(msg => ({
        text: msg.text,
        user: msg.user,
        ts: msg.ts,
        thread_ts: msg.thread_ts,
      }));
    } catch (error) {
      throw new Error(`Failed to read Slack messages: ${error.message}`);
    }
  }

  async write(data, options = {}) {
    const { channel, text, blocks, threadTs } = options;
    const targetChannel = channel || this.config.defaultChannel || data.channel;

    if (!targetChannel) {
      throw new Error('channel is required');
    }

    const messageText = text || data.text || data.message || '';

    try {
      const response = await this.client.chat.postMessage({
        channel: targetChannel,
        text: messageText,
        blocks,
        thread_ts: threadTs,
      });

      return {
        success: true,
        message: `Message sent successfully to ${targetChannel}`,
        ts: response.ts,
      };
    } catch (error) {
      throw new Error(`Failed to send Slack message: ${error.message}`);
    }
  }

  async listChannels() {
    try {
      const response = await this.client.conversations.list({
        types: 'public_channel,private_channel',
      });

      return (response.channels || []).map(channel => ({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.is_private,
      }));
    } catch (error) {
      throw new Error(`Failed to list channels: ${error.message}`);
    }
  }

  getMetadata() {
    return {
      name: 'Slack',
      type: 'slack',
      description: 'Send and read messages in Slack',
    };
  }
}

module.exports = SlackConnector;

