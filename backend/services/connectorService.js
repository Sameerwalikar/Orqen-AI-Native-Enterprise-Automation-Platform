const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const S3Connector = require('./connectors/s3/S3Connector');
const GoogleSheetsConnector = require('./connectors/googleSheets/GoogleSheetsConnector');
const GmailConnector = require('./connectors/gmail/GmailConnector');
const GoogleCalendarConnector = require('./connectors/googleCalendar/GoogleCalendarConnector');
const SlackConnector = require('./connectors/slack/SlackConnector');

const prisma = new PrismaClient();

// Encryption key (in production, use environment variable)
const ENCRYPTION_KEY = process.env.CONNECTOR_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
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
      case 's3':
        return new S3Connector(config);
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
    const sensitiveFields = ['accessKeyId', 'secretAccessKey', 'token', 'refresh_token', 'access_token', 'bot_token', 'apiKey'];
    
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
    const sensitiveFields = ['accessKeyId', 'secretAccessKey', 'token', 'refresh_token', 'access_token', 'bot_token', 'apiKey'];
    
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
        id: 's3',
        name: 'AWS S3 / MinIO',
        description: 'Connect to AWS S3 or S3-compatible storage (MinIO)',
        icon: 'database',
        requiresAuth: true,
        config: {
          accessKeyId: { type: 'string', label: 'Access Key ID', required: true, secret: true },
          secretAccessKey: { type: 'string', label: 'Secret Access Key', required: true, secret: true },
          region: { type: 'string', label: 'Region', required: false, default: 'us-east-1' },
          bucket: { type: 'string', label: 'Bucket Name', required: true },
          endpoint: { type: 'string', label: 'Custom Endpoint (for MinIO)', required: false },
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
}

module.exports = new ConnectorService();

