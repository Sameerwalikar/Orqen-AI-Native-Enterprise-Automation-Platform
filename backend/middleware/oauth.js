const { PrismaClient } = require('@prisma/client');
const { google } = require('googleapis');
const { WebClient } = require('@slack/web-api');
const connectorService = require('../services/connectorService');

const prisma = new PrismaClient();

/**
 * OAuth 2.0 Helper for Google Services
 */
class GoogleOAuthHelper {
  constructor() {
    this.oauth2Client = null;
    this.initializeOAuth();
  }

  initializeOAuth() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/oauth/google/callback';

    if (clientId && clientSecret) {
      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );
    }
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(connectorType, userId, connectorId = null) {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
    }

    const scopes = this.getScopesForConnector(connectorType);
    const state = Buffer.from(JSON.stringify({ userId, connectorType, connectorId })).toString('base64');

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Get scopes for connector type
   */
  getScopesForConnector(connectorType) {
    const scopes = {
      google_sheets: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
      gmail: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
      ],
      google_calendar: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    };

    return scopes[connectorType] || [];
  }

  /**
   * Exchange code for tokens
   */
  async getTokens(code) {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth not configured');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth not configured');
    }

    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();

    return {
      access_token: credentials.access_token,
      expiry_date: credentials.expiry_date,
    };
  }

  /**
   * Get authenticated client
   */
  getAuthenticatedClient(tokens) {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth not configured');
    }

    this.oauth2Client.setCredentials(tokens);
    return this.oauth2Client;
  }
}

/**
 * OAuth Helper for Slack
 */
class SlackOAuthHelper {
  constructor() {
    this.clientId = process.env.SLACK_CLIENT_ID;
    this.clientSecret = process.env.SLACK_CLIENT_SECRET;
    this.redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/oauth/slack/callback';
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(userId, connectorId = null) {
    if (!this.clientId) {
      throw new Error('Slack OAuth not configured. Set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET');
    }

    const state = Buffer.from(JSON.stringify({ userId, connectorId })).toString('base64');
    const scopes = [
      'channels:read',
      'chat:write',
      'files:write',
      'users:read',
    ];

    return `https://slack.com/oauth/v2/authorize?client_id=${this.clientId}&scope=${scopes.join(',')}&redirect_uri=${encodeURIComponent(this.redirectUri)}&state=${state}`;
  }

  /**
   * Exchange code for tokens
   */
  async getTokens(code) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Slack OAuth not configured');
    }

    const client = new WebClient();
    const response = await client.oauth.v2.access({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri,
    });

    return {
      access_token: response.access_token,
      bot_token: response.bot_user_id ? response.access_token : null,
      team_id: response.team?.id,
      team_name: response.team?.name,
    };
  }
}

const googleOAuth = new GoogleOAuthHelper();
const slackOAuth = new SlackOAuthHelper();

module.exports = {
  googleOAuth,
  slackOAuth,
};

