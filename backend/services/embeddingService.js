/**
 * Embedding Service
 * Generates vector embeddings using OpenAI API
 */

class EmbeddingService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.apiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
    this.model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
    this.dimensions = 1536; // Default for text-embedding-3-small
  }

  /**
   * Generate embedding for a single text
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Vector embedding
   */
  async generateEmbedding(text) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text is required and must be a non-empty string');
    }

    try {
      const response = await fetch(`${this.apiBase}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: text.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const embedding = data.data[0]?.embedding;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Invalid embedding response from OpenAI');
      }

      return embedding;
    } catch (error) {
      if (error.message.includes('OpenAI API')) {
        throw error;
      }
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   * @param {string[]} texts - Array of texts to embed
   * @returns {Promise<number[][]>} - Array of vector embeddings
   */
  async generateEmbeddings(texts) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }

    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    // Filter out empty texts
    const validTexts = texts.filter(text => text && typeof text === 'string' && text.trim().length > 0);

    if (validTexts.length === 0) {
      throw new Error('No valid texts to embed');
    }

    try {
      const response = await fetch(`${this.apiBase}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: validTexts.map(text => text.trim()),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const embeddings = data.data.map(item => item.embedding);

      if (!embeddings || embeddings.length !== validTexts.length) {
        throw new Error('Invalid embeddings response from OpenAI');
      }

      return embeddings;
    } catch (error) {
      if (error.message.includes('OpenAI API')) {
        throw error;
      }
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  /**
   * Get embedding dimensions for the current model
   * @returns {number}
   */
  getDimensions() {
    return this.dimensions;
  }

  /**
   * Check if embedding service is available
   * @returns {boolean}
   */
  isAvailable() {
    return !!this.apiKey;
  }
}

module.exports = new EmbeddingService();

