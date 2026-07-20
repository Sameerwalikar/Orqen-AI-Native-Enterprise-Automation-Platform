class LLMProvider {
  /**
   * Execute chat completion
   * @param {Object} options - Chat options
   * @param {string} options.model - Model name
   * @param {Array} options.messages - Messages array
   * @param {number} [options.temperature] - Temperature
   * @returns {Promise<{output: string, usage: Object, model: string}>}
   */
  async executeChat(options) {
    throw new Error('executeChat not implemented');
  }
}

module.exports = LLMProvider;
