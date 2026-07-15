const BaseConnector = require('../base/BaseConnector');
const { google } = require('googleapis');
const { googleOAuth } = require('../../../middleware/oauth');

/**
 * Google Calendar Connector
 */
class GoogleCalendarConnector extends BaseConnector {
  constructor(config = {}) {
    super(config);
    this.calendar = null;
  }

  async initializeCalendar() {
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
    this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
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
      await this.initializeCalendar();
      const calendarList = await this.calendar.calendarList.list();
      return { success: true, message: `Google Calendar connection successful (${calendarList.data.items?.length || 0} calendars)` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async read(options = {}) {
    const { calendarId = 'primary', timeMin, timeMax, maxResults = 10 } = options;

    try {
      await this.initializeCalendar();
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      return events.map(event => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        attendees: event.attendees?.map(a => a.email) || [],
      }));
    } catch (error) {
      throw new Error(`Failed to read calendar events: ${error.message}`);
    }
  }

  async write(data, options = {}) {
    const { calendarId = 'primary', summary, description, start, end, location, attendees } = options;

    if (!summary || !start) {
      throw new Error('summary and start are required');
    }

    try {
      await this.initializeCalendar();
      const event = {
        summary: summary || data.summary,
        description: description || data.description,
        start: {
          dateTime: start || data.start,
          timeZone: 'UTC',
        },
        end: {
          dateTime: end || data.end || start || data.start,
          timeZone: 'UTC',
        },
        location: location || data.location,
        attendees: (attendees || data.attendees || []).map(email => ({ email })),
      };

      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: event,
      });

      return {
        success: true,
        message: `Event created successfully: ${response.data.summary}`,
        eventId: response.data.id,
      };
    } catch (error) {
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  getMetadata() {
    return {
      name: 'Google Calendar',
      type: 'google_calendar',
      description: 'Read and create calendar events',
    };
  }
}

module.exports = GoogleCalendarConnector;

