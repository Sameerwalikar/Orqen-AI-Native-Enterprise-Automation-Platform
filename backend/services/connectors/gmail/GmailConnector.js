const BaseConnector = require('../base/BaseConnector');
const { google } = require('googleapis');
const { googleOAuth } = require('../../../middleware/oauth');

/**
 * Gmail Connector
 */
class GmailConnector extends BaseConnector {
  constructor(config = {}) {
    super(config);
    this.gmail = null;
  }

  async initializeGmail() {
    // Refresh token if needed
    let tokens = {
      access_token: this.config.access_token,
      refresh_token: this.config.refresh_token,
      expiry_date: this.config.expiry_date,
    };

    // Check if token needs refresh
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
      if (tokens.refresh_token) {
        const refreshed = await googleOAuth.refreshToken(tokens.refresh_token);
        tokens = { ...tokens, ...refreshed };
      }
    }

    const oauth2Client = googleOAuth.getAuthenticatedClient(tokens);
    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async validateConfig() {
    const errors = [];
    if (!this.config.access_token && !this.config.refresh_token) {
      errors.push('OAuth tokens are required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async test() {
    try {
      await this.validateConfig();
      await this.initializeGmail();
      const profile = await this.gmail.users.getProfile({ userId: 'me' });
      return { success: true, message: `Gmail connection successful (${profile.data.emailAddress})` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async read(options = {}) {
    const { query, maxResults = 10 } = options;

    try {
      await this.initializeGmail();
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query || '',
        maxResults,
      });

      const messages = response.data.messages || [];
      const detailedMessages = await Promise.all(
        messages.map(async (msg) => {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full',
          });
          return this.parseMessage(detail.data);
        })
      );

      return detailedMessages;
    } catch (error) {
      throw new Error(`Failed to read emails: ${error.message}`);
    }
  }

  async write(data, options = {}) {
    const { to, subject, body, htmlBody } = options;

    if (!to || !subject) {
      throw new Error('to and subject are required');
    }

    try {
      await this.initializeGmail();
      const message = this.createMessage({
        to,
        subject,
        text: body || '',
        html: htmlBody || '',
      });

      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });

      return {
        success: true,
        message: `Email sent successfully to ${to}`,
      };
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  parseMessage(message) {
    const headers = message.payload.headers;
    const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

    return {
      id: message.id,
      threadId: message.threadId,
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      date: getHeader('Date'),
      snippet: message.snippet,
      body: this.extractBody(message.payload),
    };
  }

  extractBody(payload) {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString();
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString();
        }
      }
    }

    return '';
  }

  createMessage({ to, subject, text, html }) {
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      html || text,
    ].join('\n');

    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  getMetadata() {
    return {
      name: 'Gmail',
      type: 'gmail',
      description: 'Read and send emails via Gmail',
    };
  }
}

module.exports = GmailConnector;

