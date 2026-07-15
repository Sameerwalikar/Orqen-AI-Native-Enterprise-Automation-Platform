/**
 * Base Connector Class
 * All connectors should extend this class
 */
class BaseConnector {
  constructor(config = {}) {
    this.config = config;
    this.name = this.constructor.name;
  }

  /**
   * Test the connector connection
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async test() {
    throw new Error('test() method must be implemented by connector');
  }

  /**
   * Read data from the connector
   * @param {object} options - Read options
   * @returns {Promise<any>} - Data read from connector
   */
  async read(options = {}) {
    throw new Error('read() method must be implemented by connector');
  }

  /**
   * Write data to the connector
   * @param {any} data - Data to write
   * @param {object} options - Write options
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async write(data, options = {}) {
    throw new Error('write() method must be implemented by connector');
  }

  /**
   * Validate connector configuration
   * @returns {Promise<{valid: boolean, errors?: string[]}>}
   */
  async validateConfig() {
    return { valid: true };
  }

  /**
   * Get connector metadata
   * @returns {object} - Connector metadata
   */
  getMetadata() {
    return {
      name: this.name,
      type: this.constructor.name,
      description: 'Base connector',
    };
  }
}

module.exports = BaseConnector;

