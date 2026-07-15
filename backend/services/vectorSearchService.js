/**
 * Vector Search Service
 * Handles vector similarity search operations
 * Currently uses PostgreSQL for storage (can be upgraded to Qdrant later)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class VectorSearchService {
  /**
   * Calculate cosine similarity between two vectors
   * @param {number[]} vec1 - First vector
   * @param {number[]} vec2 - Second vector
   * @returns {number} - Cosine similarity score (0-1)
   */
  cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Calculate euclidean distance between two vectors
   * @param {number[]} vec1 - First vector
   * @param {number[]} vec2 - Second vector
   * @returns {number} - Euclidean distance
   */
  euclideanDistance(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
      const diff = vec1[i] - vec2[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Calculate dot product between two vectors
   * @param {number[]} vec1 - First vector
   * @param {number[]} vec2 - Second vector
   * @returns {number} - Dot product
   */
  dotProduct(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
      sum += vec1[i] * vec2[i];
    }

    return sum;
  }

  /**
   * Search for similar vectors in a collection
   * @param {string} collectionId - Collection ID
   * @param {number[]} queryVector - Query vector
   * @param {object} options - Search options
   * @returns {Promise<Array>} - Array of similar vectors with scores
   */
  async search(collectionId, queryVector, options = {}) {
    const {
      limit = 10,
      minScore = 0,
      filter = null, // Metadata filter (not implemented yet)
    } = options;

    // Get collection to check distance metric
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new Error('Collection not found');
    }

    if (queryVector.length !== collection.dimensions) {
      throw new Error(`Query vector dimensions (${queryVector.length}) must match collection dimensions (${collection.dimensions})`);
    }

    // Get all vectors in collection
    const vectors = await prisma.vector.findMany({
      where: {
        collectionId,
      },
    });

    // Calculate similarity/distance for each vector
    const results = vectors.map((vector) => {
      const vectorArray = Array.isArray(vector.vector) ? vector.vector : JSON.parse(JSON.stringify(vector.vector));
      
      let score;
      if (collection.distance === 'COSINE') {
        score = this.cosineSimilarity(queryVector, vectorArray);
      } else if (collection.distance === 'EUCLIDEAN') {
        // Convert distance to similarity (lower distance = higher similarity)
        const distance = this.euclideanDistance(queryVector, vectorArray);
        score = 1 / (1 + distance); // Normalize to 0-1 range
      } else if (collection.distance === 'DOT_PRODUCT') {
        score = this.dotProduct(queryVector, vectorArray);
        // Normalize dot product to 0-1 range (assuming normalized vectors)
        score = (score + 1) / 2;
      } else {
        score = this.cosineSimilarity(queryVector, vectorArray);
      }

      return {
        id: vector.id,
        text: vector.text,
        metadata: vector.metadata,
        score,
        createdAt: vector.createdAt,
      };
    });

    // Filter by minScore and sort by score (descending)
    const filtered = results
      .filter((result) => result.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return filtered;
  }

  /**
   * Get collection statistics
   * @param {string} collectionId - Collection ID
   * @returns {Promise<object>} - Collection stats
   */
  async getCollectionStats(collectionId) {
    const [collection, vectorCount] = await Promise.all([
      prisma.collection.findUnique({
        where: { id: collectionId },
      }),
      prisma.vector.count({
        where: { collectionId },
      }),
    ]);

    if (!collection) {
      throw new Error('Collection not found');
    }

    return {
      id: collection.id,
      name: collection.name,
      vectorCount,
      dimensions: collection.dimensions,
      distance: collection.distance,
      status: collection.status,
    };
  }
}

module.exports = new VectorSearchService();

