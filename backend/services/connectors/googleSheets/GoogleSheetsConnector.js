const BaseConnector = require('../base/BaseConnector');
const { google } = require('googleapis');
const { googleOAuth } = require('../../../middleware/oauth');

/**
 * Google Sheets Connector
 */
class GoogleSheetsConnector extends BaseConnector {
  constructor(config = {}) {
    super(config);
    this.sheets = null;
  }

  initializeSheets() {
    const oauth2Client = googleOAuth.getAuthenticatedClient({
      access_token: this.config.access_token,
      refresh_token: this.config.refresh_token,
      expiry_date: this.config.expiry_date,
    });

    this.sheets = google.sheets({ version: 'v4', auth: oauth2Client });
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
      await this.initializeSheets();
      // Try to list spreadsheets
      const drive = google.drive({ version: 'v3', auth: googleOAuth.getAuthenticatedClient(this.config) });
      await drive.files.list({ q: "mimeType='application/vnd.google-apps.spreadsheet'", pageSize: 1 });
      return { success: true, message: 'Google Sheets connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async read(options = {}) {
    const { spreadsheetId, range, sheetName } = options;
    const targetSpreadsheetId = spreadsheetId || this.config.spreadsheetId;
    const targetRange = range || (sheetName ? `${sheetName}!A1:Z1000` : 'A1:Z1000');

    if (!targetSpreadsheetId) {
      throw new Error('spreadsheetId is required');
    }

    try {
      await this.initializeSheets();
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: targetSpreadsheetId,
        range: targetRange,
      });

      const rows = response.data.values || [];
      if (rows.length === 0) return [];

      // Convert to objects (first row as headers)
      const headers = rows[0];
      return rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });
    } catch (error) {
      throw new Error(`Failed to read from Google Sheets: ${error.message}`);
    }
  }

  async write(data, options = {}) {
    const { spreadsheetId, range, sheetName } = options;
    const targetSpreadsheetId = spreadsheetId || this.config.spreadsheetId;
    const targetRange = range || (sheetName ? `${sheetName}!A1` : 'A1');

    if (!targetSpreadsheetId) {
      throw new Error('spreadsheetId is required');
    }

    try {
      await this.initializeSheets();
      // Convert data to rows
      let values = [];
      if (Array.isArray(data)) {
        if (data.length === 0) return { success: true, message: 'No data to write' };
        
        // First row: headers
        const headers = Object.keys(data[0]);
        values.push(headers);
        
        // Data rows
        data.forEach(item => {
          values.push(headers.map(header => item[header] || ''));
        });
      } else {
        // Single object
        const headers = Object.keys(data);
        values.push(headers);
        values.push(headers.map(header => data[header] || ''));
      }

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: targetSpreadsheetId,
        range: targetRange,
        valueInputOption: 'RAW',
        resource: { values },
      });

      return {
        success: true,
        message: `Data written to Google Sheets: ${targetRange}`,
      };
    } catch (error) {
      throw new Error(`Failed to write to Google Sheets: ${error.message}`);
    }
  }

  getMetadata() {
    return {
      name: 'Google Sheets',
      type: 'google_sheets',
      description: 'Read and write data to Google Sheets',
    };
  }
}

module.exports = GoogleSheetsConnector;

