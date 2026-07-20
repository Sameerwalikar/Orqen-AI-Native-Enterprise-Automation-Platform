const prisma = require('../lib/prisma');
const crypto = require('crypto');
const SupabaseConnector = require('./connectors/supabase/SupabaseConnector');
const GoogleSheetsConnector = require('./connectors/googleSheets/GoogleSheetsConnector');
const GmailConnector = require('./connectors/gmail/GmailConnector');
const GoogleCalendarConnector = require('./connectors/googleCalendar/GoogleCalendarConnector');
const SlackConnector = require('./connectors/slack/SlackConnector');


// Encryption key (in production, use environment variable)
// A stable key is essential: random startup keys make saved credentials undecryptable after restart.
const ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.CONNECTOR_ENCRYPTION_KEY || process.env.DATABASE_URL || 'development-connector-key').digest('hex');
const ALGORITHM = 'aes-256-cbc';

class ConnectorService {
  /**
   * Encrypt sensitive data
   */
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  /**
   * Get connector instance
   */
  getConnectorInstance(connector) {
    const config = this.decryptConfig(connector.config);
    
    switch (connector.type) {
      case 'supabase':
        return new SupabaseConnector(config);
      case 'google_sheets':
        return new GoogleSheetsConnector(config);
      case 'slack':
        return new SlackConnector(config);
      case 'gmail':
        return new GmailConnector(config);
      case 'google_calendar':
        return new GoogleCalendarConnector(config);
      default:
        throw new Error(`Unknown connector type: ${connector.type}`);
    }
  }

  /**
   * Decrypt connector config
   */
  decryptConfig(config) {
    if (!config || typeof config !== 'object') return config;
    
    const decrypted = { ...config };
    // Decrypt sensitive fields
    const sensitiveFields = ['password', 'connectionString', 'token', 'refresh_token', 'access_token', 'bot_token', 'apiKey'];
    
    sensitiveFields.forEach(field => {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          decrypted[field] = this.decrypt(decrypted[field]);
        } catch {
          // If decryption fails, assume it's already plain text (for new connectors)
        }
      }
    });
    
    return decrypted;
  }

  /**
   * Encrypt connector config
   */
  encryptConfig(config) {
    if (!config || typeof config !== 'object') return config;
    
    const encrypted = { ...config };
    // Encrypt sensitive fields
    const sensitiveFields = ['password', 'connectionString', 'token', 'refresh_token', 'access_token', 'bot_token', 'apiKey'];
    
    sensitiveFields.forEach(field => {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    });
    
    return encrypted;
  }

  /**
   * Get available connector types
   */
  getAvailableConnectorTypes() {
    return [
      {
        id: 'supabase',
        name: 'Supabase',
        description: 'Read data from the workspace database or another Supabase PostgreSQL database',
        icon: 'database',
        requiresAuth: false,
        config: {
          mode: { type: 'select', label: 'Connection mode', default: 'default', options: ['default', 'advanced'] },
          host: { type: 'string', label: 'Host' }, database: { type: 'string', label: 'Database' }, port: { type: 'number', label: 'Port', default: 5432 },
          username: { type: 'string', label: 'Username' }, password: { type: 'string', label: 'Password', secret: true }, sslMode: { type: 'select', label: 'SSL mode', default: 'require', options: ['require', 'prefer', 'disable'] }, verifyCertificate: { type: 'boolean', label: 'Verify certificate', default: true }, timeout: { type: 'number', label: 'Timeout (seconds)', default: 10 },
        },
      },
      {
        id: 'google_sheets',
        name: 'Google Sheets',
        description: 'Connect to Google Sheets',
        icon: 'file-spreadsheet',
        requiresAuth: true,
        requiresOAuth: true,
        oauthProvider: 'google',
        config: {},
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Connect to Slack workspace',
        icon: 'message-square',
        requiresAuth: true,
        requiresOAuth: true,
        oauthProvider: 'slack',
        config: {},
      },
      {
        id: 'gmail',
        name: 'Gmail',
        description: 'Connect to Gmail',
        icon: 'mail',
        requiresAuth: true,
        requiresOAuth: true,
        oauthProvider: 'google',
        config: {},
      },
      {
        id: 'google_calendar',
        name: 'Google Calendar',
        description: 'Connect to Google Calendar',
        icon: 'calendar',
        requiresAuth: true,
        requiresOAuth: true,
        oauthProvider: 'google',
        config: {},
      },
    ];
  }

  /**
   * Test connector
   */
  async testConnector(connectorId, userId) {
    const connector = await prisma.connector.findFirst({
      where: {
        id: connectorId,
        userId,
      },
    });

    if (!connector) {
      throw new Error('Connector not found');
    }

    try {
      const instance = this.getConnectorInstance(connector);
      const result = await instance.test();

      // Update connector status
      await prisma.connector.update({
        where: { id: connectorId },
        data: {
          status: result.success ? 'ACTIVE' : 'ERROR',
          lastTested: new Date(),
          lastError: result.success ? null : result.message,
        },
      });

      return result;
    } catch (error) {
      await prisma.connector.update({
        where: { id: connectorId },
        data: {
          status: 'ERROR',
          lastTested: new Date(),
          lastError: error.message,
        },
      });

      throw error;
    }
  }

  async getOwnedConnector(id, userId) {
    const connector = await prisma.connector.findFirst({ where: { id, userId } });
    if (!connector) throw new Error('Connector not found');
    return connector;
  }

  async explorer(id, userId, action, args = [], context = {}) {
    const connector = await this.getOwnedConnector(id, userId);
    if (connector.type !== 'supabase') throw new Error('Database explorer is available only for relational connectors');
    const instance = this.getConnectorInstance(connector);
    const started = Date.now();
    try {
      const result = await instance[action](...args);
      await this.recordExecution(connector, userId, context, result?.rowCount || (Array.isArray(result) ? result.length : 0), Date.now() - started, 'COMPLETED');
      return result;
    } catch (error) {
      await this.recordExecution(connector, userId, context, 0, Date.now() - started, 'FAILED', error.message);
      throw error;
    }
  }

  async recordExecution(connector, userId, context, rowsRetrieved, duration, status, error = null) {
    return prisma.connectorExecution.create({ data: { connectorId: connector.id, userId, pipelineId: context.pipelineId, workflowId: context.workflowId, rowsRetrieved, duration, status, error } });
  }
}

module.exports = new ConnectorService();

