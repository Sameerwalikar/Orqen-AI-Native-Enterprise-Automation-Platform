const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const embeddingService = require('../services/embeddingService');
const vectorSearchService = require('../services/vectorSearchService');

const router = express.Router();
const prisma = new PrismaClient();

// ==================== COLLECTIONS ====================

// Get all collections for the authenticated user
router.get('/collections', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, organizationId } = req.query;

    const where = {
      userId,
      ...(status && { status }),
      ...(organizationId && { organizationId }),
    };

    const collections = await prisma.collection.findMany({
      where,
      include: {
        _count: {
          select: {
            vectors: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: { collections },
    });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collections',
    });
  }
});

// Get a single collection
router.get('/collections/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const collection = await prisma.collection.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        _count: {
          select: {
            vectors: true,
          },
        },
      },
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { collection },
    });
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collection',
    });
  }
});

// Create a new collection
router.post('/collections', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, dimensions, distance, organizationId } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Collection name is required',
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Collection name must be at least 2 characters',
      });
    }

    // Default dimensions (OpenAI text-embedding-3-small)
    const defaultDimensions = dimensions || embeddingService.getDimensions();
    const defaultDistance = distance || 'COSINE';

    // Validate dimensions
    if (defaultDimensions < 1 || defaultDimensions > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Dimensions must be between 1 and 10000',
      });
    }

    // Check if organization exists and user has access (if organizationId provided)
    if (organizationId) {
      const orgUser = await prisma.organizationUser.findFirst({
        where: {
          organizationId,
          userId,
          role: {
            in: ['OWNER', 'ADMIN', 'MEMBER'],
          },
        },
      });

      if (!orgUser) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this organization',
        });
      }
    }

    // Create collection
    const collection = await prisma.collection.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        dimensions: defaultDimensions,
        distance: defaultDistance,
        userId,
        organizationId: organizationId || null,
        status: 'ACTIVE',
        vectorCount: 0,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      data: { collection },
    });
  } catch (error) {
    console.error('Create collection error:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A collection with this name already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create collection',
    });
  }
});

// Update a collection
router.put('/collections/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, description, status } = req.body;

    // Check if collection exists and user owns it
    const existingCollection = await prisma.collection.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingCollection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Collection name must be at least 2 characters',
        });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (status !== undefined) {
      if (!['ACTIVE', 'ARCHIVED', 'DELETED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be ACTIVE, ARCHIVED, or DELETED',
        });
      }
      updateData.status = status;
    }

    // Update collection
    const collection = await prisma.collection.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Collection updated successfully',
      data: { collection },
    });
  } catch (error) {
    console.error('Update collection error:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update collection',
    });
  }
});

// Delete a collection
router.delete('/collections/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if collection exists and user owns it
    const existingCollection = await prisma.collection.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingCollection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    // Delete collection (cascade will delete vectors)
    await prisma.collection.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Collection deleted successfully',
    });
  } catch (error) {
    console.error('Delete collection error:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete collection',
    });
  }
});

// ==================== VECTORS ====================

// Add vectors to a collection
router.post('/collections/:id/vectors', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { texts, metadata } = req.body;

    // Find collection
    const collection = await prisma.collection.findFirst({
      where: {
        id,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found or not active',
      });
    }

    // Validate input
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Texts must be a non-empty array',
      });
    }

    // Check if embedding service is available
    if (!embeddingService.isAvailable()) {
      return res.status(500).json({
        success: false,
        message: 'Embedding service not available. Please configure OPENAI_API_KEY',
      });
    }

    // Generate embeddings
    let embeddings;
    try {
      embeddings = await embeddingService.generateEmbeddings(texts);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Failed to generate embeddings: ${error.message}`,
      });
    }

    // Create vector records
    const vectors = [];
    for (let i = 0; i < texts.length; i++) {
      const vector = await prisma.vector.create({
        data: {
          collectionId: id,
          vector: embeddings[i],
          text: texts[i],
          metadata: metadata && Array.isArray(metadata) && metadata[i] ? metadata[i] : null,
        },
      });
      vectors.push(vector);
    }

    // Update collection vector count
    await prisma.collection.update({
      where: { id },
      data: {
        vectorCount: {
          increment: vectors.length,
        },
      },
    });

    res.status(201).json({
      success: true,
      message: `Successfully added ${vectors.length} vector(s)`,
      data: { vectors },
    });
  } catch (error) {
    console.error('Add vectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add vectors',
    });
  }
});

// Search vectors in a collection
router.post('/collections/:id/search', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { query, limit = 10, minScore = 0 } = req.body;

    // Find collection
    const collection = await prisma.collection.findFirst({
      where: {
        id,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found or not active',
      });
    }

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query text is required',
      });
    }

    // Check if embedding service is available
    if (!embeddingService.isAvailable()) {
      return res.status(500).json({
        success: false,
        message: 'Embedding service not available. Please configure OPENAI_API_KEY',
      });
    }

    // Generate embedding for query
    let queryVector;
    try {
      queryVector = await embeddingService.generateEmbedding(query);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Failed to generate query embedding: ${error.message}`,
      });
    }

    // Search for similar vectors
    const results = await vectorSearchService.search(id, queryVector, {
      limit: parseInt(limit),
      minScore: parseFloat(minScore),
    });

    res.status(200).json({
      success: true,
      data: {
        results,
        query,
        collectionId: id,
      },
    });
  } catch (error) {
    console.error('Search vectors error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search vectors',
    });
  }
});

// Get vectors in a collection
router.get('/collections/:id/vectors', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    // Verify collection belongs to user
    const collection = await prisma.collection.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    // Get vectors
    const [vectors, total] = await Promise.all([
      prisma.vector.findMany({
        where: { collectionId: id },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          text: true,
          metadata: true,
          createdAt: true,
          // Don't return vector data (too large)
        },
      }),
      prisma.vector.count({
        where: { collectionId: id },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        vectors,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + vectors.length < total,
        },
      },
    });
  } catch (error) {
    console.error('Get vectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vectors',
    });
  }
});

module.exports = router;

