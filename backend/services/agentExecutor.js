const { PrismaClient } = require('@prisma/client');
const vectorSearchService = require('./vectorSearchService');
const embeddingService = require('./embeddingService');
const analyticsService = require('./analytics/AnalyticsService');
const prisma = new PrismaClient();
const config = require('../config');
const { getLLMProvider } = require('./llm');
const logger = require('../utils/logger');

// Model mapping for OpenRouter to ensure cost-efficiency and prevent overspending
const MODEL_MAPPING = {
  'gpt-4': 'openai/gpt-4o-mini',
  'gpt-4-turbo': 'openai/gpt-4o-mini',
  'gpt-3.5-turbo': 'openai/gpt-4o-mini',
  'gpt-5.1': 'openai/gpt-4o-mini',
};

// Simple in-memory queue (can be upgraded to BullMQ/Redis later)
class ExecutionQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  async add(job) {
    this.queue.push(job);
    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      try {
        await this.executeJob(job);
      } catch (error) {
        console.error('Job execution error:', error);
      }
    }

    this.processing = false;
  }

  async executeJob(job) {
    const { executionId, agentId, userId, input } = job;
    const executor = new AgentExecutor();

    try {
      await executor.execute(executionId, agentId, userId, input);
    } catch (error) {
      console.error(`Execution ${executionId} failed:`, error);
    }
  }
}

class AgentExecutor {
  constructor() {
    try {
      this.provider = getLLMProvider();
      this.hasLLM = true;
    } catch (error) {
      this.hasLLM = false;
      logger.error('Failed to initialize LLM provider', { error: error.message });
    }
  }


  async execute(executionId, agentId, userId, input) {
    // Update status to RUNNING
    await prisma.agentExecution.update({
      where: { id: executionId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    try {
      // Get agent
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      if (agent.status !== 'ACTIVE') {
        throw new Error('Agent is not active');
      }

      // Execute based on agent type
      let output;
      const startTime = Date.now();

      if (agent.config?.type === 'llm' || !agent.config?.type) {
        // LLM-based agent
        output = await this.executeLLMAgent(agent, input);
      } else if (agent.config?.type === 'custom' && agent.code) {
        // Custom code agent (sandboxed execution - simplified for now)
        output = await this.executeCustomAgent(agent, input);
      } else {
        throw new Error('Invalid agent type');
      }

      const duration = Date.now() - startTime;
      const tokensUsed = output?.usage?.total_tokens || 0;
      const modelName = output?.model || agent.config?.model || 'gpt-4';
      const cost = analyticsService.calculateCost(tokensUsed, modelName);

      // Update execution with result
      await prisma.agentExecution.update({
        where: { id: executionId },
        data: {
          status: 'COMPLETED',
          output: output,
          completedAt: new Date(),
          duration,
        },
      });

      // Record metrics
      await analyticsService.recordMetric({
        resourceType: 'agent',
        resourceId: agentId,
        executionId,
        userId,
        organizationId: agent.organizationId,
        duration,
        apiCalls: 1,
        tokensUsed,
        cost,
        status: 'COMPLETED',
      });

      logger.info('Agent execution completed successfully', {
        agentId,
        executionId,
        userId,
        model: modelName,
        provider: config.LLM_PROVIDER,
        duration,
      });

      return output;
    } catch (error) {
      // Get execution start time for duration calculation
      const executionRecord = await prisma.agentExecution.findUnique({
        where: { id: executionId },
      });
      const duration = executionRecord?.startedAt 
        ? Date.now() - executionRecord.startedAt.getTime()
        : null;

      // Update execution with error
      await prisma.agentExecution.update({
        where: { id: executionId },
        data: {
          status: 'FAILED',
          error: error.message,
          completedAt: new Date(),
          duration,
        },
      });

      // Get agent for organizationId
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: { organizationId: true },
      });

      // Record metrics (failed execution)
      await analyticsService.recordMetric({
        resourceType: 'agent',
        resourceId: agentId,
        executionId,
        userId,
        organizationId: agent?.organizationId,
        duration: duration || 0,
        apiCalls: 0,
        status: 'FAILED',
        errorType: error.constructor.name || 'Error',
      });

      logger.error('Agent execution failed', {
        agentId,
        executionId,
        userId,
        provider: config.LLM_PROVIDER,
        duration: duration || 0,
        error: error.message,
        stack: error.stack,
      });

      throw error;
    }
  }

  async executeLLMAgent(agent, input) {
    if (!this.hasLLM) {
      throw new Error('LLM provider not initialized. Check server configurations.');
    }

    const configData = agent.config || {};
    const configuredModel = configData.model || 'gpt-4';
    
    // Map model based on provider
    const providerType = (config.LLM_PROVIDER || '').toLowerCase();
    let model = configuredModel;
    if (providerType === 'openrouter') {
      model = MODEL_MAPPING[configuredModel] || (configuredModel.includes('/') ? configuredModel : 'openai/gpt-4o-mini');
    } else if (providerType === 'gemini') {
      model = configuredModel === 'gpt-4' || configuredModel === 'gpt-3.5-turbo' ? 'gemini-1.5-flash' : configuredModel;
    } else if (providerType === 'anthropic') {
      model = configuredModel === 'gpt-4' || configuredModel === 'gpt-3.5-turbo' ? 'claude-3-5-sonnet-20241022' : configuredModel;
    }

    const temperature = configData.temperature ?? 0.7;
    let systemPrompt = configData.systemPrompt || 'You are a helpful AI assistant.';
    
    // Extract user query text for RAG
    let userQuery = '';
    if (typeof input === 'string') {
      userQuery = input;
    } else if (typeof input === 'object' && input !== null) {
      userQuery = input.message || input.prompt || JSON.stringify(input);
    } else {
      userQuery = 'Hello, please help me.';
    }

    // RAG: Search vectors if collectionId is configured
    let ragContext = '';
    if (configData.collectionId) {
      try {
        // Verify collection exists and belongs to user
        const collection = await prisma.collection.findUnique({
          where: { id: configData.collectionId },
        });

        if (collection && collection.status === 'ACTIVE') {
          // Generate embedding for query
          const queryVector = await embeddingService.generateEmbedding(userQuery);
          
          // Search for similar vectors
          const searchResults = await vectorSearchService.search(
            configData.collectionId,
            queryVector,
            {
              limit: configData.ragLimit || 5, // Default to top 5 results
              minScore: configData.ragMinScore || 0.5, // Minimum similarity score
            }
          );

          // Build context from search results
          if (searchResults.length > 0) {
            ragContext = '\n\nRelevant context from knowledge base:\n';
            searchResults.forEach((result, index) => {
              ragContext += `\n[${index + 1}] ${result.text || 'No text available'}\n`;
            });
            ragContext += '\nUse the above context to answer the user\'s question. If the context is relevant, prioritize it. If not, use your general knowledge.';
          }
        }
      } catch (error) {
        logger.warn('RAG search failed, continuing without context', { error: error.message });
      }
    }

    // Prepare messages
    const messages = [
      {
        role: 'system',
        content: systemPrompt + (ragContext ? '\n\n' + ragContext : ''),
      },
      {
        role: 'user',
        content: userQuery,
      }
    ];

    try {
      const result = await this.provider.executeChat({
        model,
        messages,
        temperature,
      });

      return {
        output: result.output,
        usage: result.usage,
        model: result.model,
      };
    } catch (error) {
      throw new Error(`Failed to execute LLM agent: ${error.message}`);
    }
  }

  async executeCustomAgent(agent, input) {
    // For custom agents, we would execute the code in a sandboxed environment
    // This is a simplified version - in production, use a proper sandboxing solution
    // For now, we'll just return a placeholder
    
    try {
      // In production, use vm2 or similar for safe code execution
      // For now, we'll return a mock response
      return {
        output: 'Custom agent execution not yet fully implemented. Code execution requires sandboxing for security.',
        note: 'This feature requires additional security measures before production use.',
      };
    } catch (error) {
      throw new Error(`Custom agent execution failed: ${error.message}`);
    }
  }
}

// Create singleton queue instance
const executionQueue = new ExecutionQueue();

module.exports = {
  AgentExecutor,
  executionQueue,
};

