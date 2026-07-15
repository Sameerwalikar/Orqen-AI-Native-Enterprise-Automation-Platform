/**
 * Pipeline Engine
 * Executes data pipelines with connectors and transformations
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs').promises;
const analyticsService = require('./analytics/AnalyticsService');
const path = require('path');

class PipelineEngine {
  /**
   * Execute a pipeline
   * @param {string} pipelineId - Pipeline ID
   * @param {object} input - Input data
   * @param {number} userId - User ID
   * @returns {Promise<object>} - Execution result
   */
  async execute(pipelineId, input = {}, userId = null) {
    // Get pipeline
    const pipeline = await prisma.pipeline.findUnique({
      where: { id: pipelineId },
    });

    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    if (pipeline.status !== 'ACTIVE') {
      throw new Error('Pipeline is not active');
    }

    const definition = pipeline.definition;
    const steps = definition.steps || [];

    if (steps.length === 0) {
      throw new Error('Pipeline has no steps');
    }

    // Execution context
    const context = {
      input,
      data: input,
      variables: { ...input },
      currentStep: 0,
      executionLog: [],
      recordsProcessed: 0,
    };

    // Execute pipeline steps sequentially
    try {
      for (let i = 0; i < steps.length; i++) {
        context.currentStep = i;
        const step = steps[i];

        context.executionLog.push({
          step: i,
          stepType: step.type,
          timestamp: new Date().toISOString(),
          message: `Executing step ${i + 1}: ${step.label || step.type}`,
        });

        // Execute step
        const stepResult = await this.executeStep(step, context, userId);

        // Update context with step result
        if (stepResult) {
          if (step.outputVariable) {
            context.variables[step.outputVariable] = stepResult;
          }
          // Update data for next step
          context.data = stepResult;
        }

        context.executionLog.push({
          step: i,
          stepType: step.type,
          timestamp: new Date().toISOString(),
          message: `Completed step ${i + 1}`,
          recordsProcessed: Array.isArray(stepResult) ? stepResult.length : 1,
        });

        if (Array.isArray(stepResult)) {
          context.recordsProcessed += stepResult.length;
        } else {
          context.recordsProcessed += 1;
        }
      }

      return {
        success: true,
        output: context.data,
        recordsProcessed: context.recordsProcessed,
        logs: context.executionLog,
      };
    } catch (error) {
      context.executionLog.push({
        step: context.currentStep,
        timestamp: new Date().toISOString(),
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
        logs: context.executionLog,
        recordsProcessed: context.recordsProcessed,
      };
    }
  }

  /**
   * Execute a single pipeline step
   * @param {object} step - Step definition
   * @param {object} context - Execution context
   * @param {number} userId - User ID
   * @returns {Promise<any>} - Step output
   */
  async executeStep(step, context, userId) {
    switch (step.type) {
      case 'connector':
        return await this.executeConnector(step, context, userId);
      case 'transform':
        return await this.executeTransform(step, context);
      case 'filter':
        return await this.executeFilter(step, context);
      case 'aggregate':
        return await this.executeAggregate(step, context);
      case 'agent':
        return await this.executeAgentStep(step, context, userId);
      case 'vector':
        return await this.executeVectorStep(step, context, userId);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Execute connector step (data source)
   * @param {object} step - Step definition
   * @param {object} context - Execution context
   * @param {number} userId - User ID
   * @returns {Promise<any>} - Connector output
   */
  async executeConnector(step, context, userId) {
    const connectorType = step.connector || step.data?.connector;
    const config = step.config || step.data?.config || {};

    switch (connectorType) {
      case 'static':
        // Static data connector
        return config.data || [];

      case 'json':
        // JSON file connector
        if (config.filePath) {
          try {
            const fileContent = await fs.readFile(config.filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            return Array.isArray(data) ? data : [data];
          } catch (error) {
            throw new Error(`Failed to read JSON file: ${error.message}`);
          }
        }
        return [];

      case 'csv':
        // CSV file connector (simplified - in production use csv-parser)
        if (config.filePath) {
          try {
            const fileContent = await fs.readFile(config.filePath, 'utf-8');
            const lines = fileContent.split('\n').filter((line) => line.trim());
            const headers = lines[0].split(',').map((h) => h.trim());
            const data = lines.slice(1).map((line) => {
              const values = line.split(',');
              const obj = {};
              headers.forEach((header, index) => {
                obj[header] = values[index]?.trim() || '';
              });
              return obj;
            });
            return data;
          } catch (error) {
            throw new Error(`Failed to read CSV file: ${error.message}`);
          }
        }
        return [];

      case 'api':
        // HTTP API connector
        if (config.url) {
          try {
            const response = await fetch(config.url, {
              method: config.method || 'GET',
              headers: config.headers || {},
              body: config.body ? JSON.stringify(config.body) : undefined,
            });

            if (!response.ok) {
              throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return Array.isArray(data) ? data : [data];
          } catch (error) {
            throw new Error(`API connector failed: ${error.message}`);
          }
        }
        return [];

      case 'database':
        // Database connector (PostgreSQL)
        if (config.query) {
          try {
            const result = await prisma.$queryRawUnsafe(config.query);
            return Array.isArray(result) ? result : [result];
          } catch (error) {
            throw new Error(`Database query failed: ${error.message}`);
          }
        }
        return [];

      default:
        throw new Error(`Unknown connector type: ${connectorType}`);
    }
  }

  /**
   * Execute transform step
   * @param {object} step - Step definition
   * @param {object} context - Execution context
   * @returns {Promise<any>} - Transformed data
   */
  async executeTransform(step, context) {
    const data = context.data;
    const transform = step.transform || step.data?.transform;

    if (!transform) {
      return data;
    }

    // Handle array data
    if (Array.isArray(data)) {
      return data.map((item) => this.applyTransform(item, transform, context.variables));
    }

    // Handle single object
    return this.applyTransform(data, transform, context.variables);
  }

  /**
   * Apply transformation to a single item
   * @param {object} item - Data item
   * @param {object} transform - Transform definition
   * @param {object} variables - Context variables
   * @returns {object} - Transformed item
   */
  applyTransform(item, transform, variables) {
    if (typeof transform === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(transform)) {
        if (typeof value === 'string' && value.startsWith('$')) {
          // Variable reference
          result[key] = variables[value.substring(1)] || item[value.substring(1)];
        } else if (typeof value === 'string' && value.includes('${')) {
          // Template string
          result[key] = value.replace(/\${([^}]+)}/g, (match, varName) => {
            return variables[varName] || item[varName] || match;
          });
        } else {
          result[key] = value;
        }
      }
      return result;
    }

    return item;
  }

  /**
   * Execute filter step
   * @param {object} step - Step definition
   * @param {object} context - Execution context
   * @returns {Promise<any>} - Filtered data
   */
  async executeFilter(step, context) {
    const data = context.data;
    const filter = step.filter || step.data?.filter;

    if (!filter || !Array.isArray(data)) {
      return data;
    }

    const { field, operator, value } = filter;

    return data.filter((item) => {
      const fieldValue = item[field];

      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'notEquals':
          return fieldValue !== value;
        case 'greaterThan':
          return fieldValue > value;
        case 'lessThan':
          return fieldValue < value;
        case 'contains':
          return String(fieldValue).includes(String(value));
        case 'startsWith':
          return String(fieldValue).startsWith(String(value));
        case 'endsWith':
          return String(fieldValue).endsWith(String(value));
        default:
          return true;
      }
    });
  }

  /**
   * Execute aggregate step
   * @param {object} step - Step definition
   * @param {object} context - Execution context
   * @returns {Promise<any>} - Aggregated data
   */
  async executeAggregate(step, context) {
    const data = context.data;
    const aggregate = step.aggregate || step.data?.aggregate;

    if (!aggregate || !Array.isArray(data)) {
      return data;
    }

    const { operation, field } = aggregate;

    switch (operation) {
      case 'count':
        return { count: data.length };
      case 'sum':
        return {
          sum: data.reduce((acc, item) => acc + (parseFloat(item[field]) || 0), 0),
        };
      case 'average':
        const sum = data.reduce((acc, item) => acc + (parseFloat(item[field]) || 0), 0);
        return { average: data.length > 0 ? sum / data.length : 0 };
      case 'min':
        return {
          min: Math.min(...data.map((item) => parseFloat(item[field]) || 0)),
        };
      case 'max':
        return {
          max: Math.max(...data.map((item) => parseFloat(item[field]) || 0)),
        };
      case 'groupBy':
        const groupField = field;
        const grouped = {};
        data.forEach((item) => {
          const key = item[groupField];
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(item);
        });
        return grouped;
      default:
        return data;
    }
  }

  /**
   * Execute agent step (call an agent)
   * @param {object} step - Step definition
   * @param {object} context - Execution context
   * @param {number} userId - User ID
   * @returns {Promise<any>} - Agent output
   */
  async executeAgentStep(step, context, userId) {
    const agentId = step.agentId || step.data?.agentId;
    if (!agentId) {
      throw new Error('Agent ID not specified in agent step');
    }

    // Get input for agent
    const agentInput = step.input || step.data?.input || context.data;

    // Create agent execution
    const execution = await prisma.agentExecution.create({
      data: {
        agentId,
        userId,
        status: 'PENDING',
        input: agentInput,
      },
    });

    // Queue agent execution (simplified - in production use proper queue)
    const { executionQueue: agentExecutionQueue } = require('./agentExecutor');
    await agentExecutionQueue.add({
      executionId: execution.id,
      agentId,
      userId,
      input: agentInput,
    });

    // Wait for execution (simplified polling)
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedExecution = await prisma.agentExecution.findUnique({
        where: { id: execution.id },
      });

      if (updatedExecution.status === 'COMPLETED') {
        // Track tokens and API calls from agent execution
        if (updatedExecution.output?.usage) {
          context.tokensUsed += updatedExecution.output.usage.total_tokens || 0;
          context.apiCalls++;
        }
        return updatedExecution.output;
      } else if (updatedExecution.status === 'FAILED') {
        throw new Error(updatedExecution.error || 'Agent execution failed');
      }

      attempts++;
    }

    throw new Error('Agent execution timeout');
  }

  /**
   * Execute vector step (add to vector collection)
   * @param {object} step - Step definition
   * @param {object} context - Execution context
   * @param {number} userId - User ID
   * @returns {Promise<any>} - Vector operation result
   */
  async executeVectorStep(step, context, userId) {
    const collectionId = step.collectionId || step.data?.collectionId;
    const operation = step.operation || step.data?.operation || 'add';

    if (!collectionId) {
      throw new Error('Collection ID not specified in vector step');
    }

    // Verify collection exists and belongs to user
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!collection) {
      throw new Error('Collection not found or not active');
    }

    const data = context.data;
    const embeddingService = require('./embeddingService');
    const vectorSearchService = require('./vectorSearchService');

    switch (operation) {
      case 'add':
        // Add vectors to collection
        if (Array.isArray(data)) {
          const texts = data.map((item) => {
            if (typeof item === 'string') {
              return item;
            }
            // Extract text field or convert to string
            return item.text || item.content || JSON.stringify(item);
          });

          // Generate embeddings
          const embeddings = await embeddingService.generateEmbeddings(texts);

          // Create vector records
          const vectors = [];
          for (let i = 0; i < texts.length; i++) {
            const vector = await prisma.vector.create({
              data: {
                collectionId,
                vector: embeddings[i],
                text: texts[i],
                metadata: data[i] && typeof data[i] === 'object' ? data[i] : null,
              },
            });
            vectors.push(vector);
          }

          // Update collection vector count
          await prisma.collection.update({
            where: { id: collectionId },
            data: {
              vectorCount: {
                increment: vectors.length,
              },
            },
          });

          return { vectorsAdded: vectors.length };
        }
        return { vectorsAdded: 0 };

      case 'search':
        // Search vectors
        const query = step.query || step.data?.query || '';
        if (!query) {
          throw new Error('Search query not specified');
        }

        const queryVector = await embeddingService.generateEmbedding(query);
        const results = await vectorSearchService.search(collectionId, queryVector, {
          limit: step.limit || 10,
        });

        return results;

      default:
        throw new Error(`Unknown vector operation: ${operation}`);
    }
  }

  /**
   * Get available connectors
   * @returns {Array} - List of available connectors
   */
  getAvailableConnectors() {
    return [
      {
        id: 'static',
        name: 'Static Data',
        description: 'Use static data',
        config: {
          data: { type: 'array', description: 'Array of data objects' },
        },
      },
      {
        id: 'json',
        name: 'JSON File',
        description: 'Read from JSON file',
        config: {
          filePath: { type: 'string', description: 'Path to JSON file' },
        },
      },
      {
        id: 'csv',
        name: 'CSV File',
        description: 'Read from CSV file',
        config: {
          filePath: { type: 'string', description: 'Path to CSV file' },
        },
      },
      {
        id: 'api',
        name: 'HTTP API',
        description: 'Fetch from HTTP API',
        config: {
          url: { type: 'string', description: 'API URL' },
          method: { type: 'string', description: 'HTTP method', default: 'GET' },
          headers: { type: 'object', description: 'HTTP headers' },
          body: { type: 'object', description: 'Request body' },
        },
      },
      {
        id: 'database',
        name: 'Database',
        description: 'Query database',
        config: {
          query: { type: 'string', description: 'SQL query' },
        },
      },
    ];
  }
}

module.exports = new PipelineEngine();

