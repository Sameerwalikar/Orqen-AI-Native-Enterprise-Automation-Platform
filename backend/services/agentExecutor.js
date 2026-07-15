const { PrismaClient } = require('@prisma/client');
const vectorSearchService = require('./vectorSearchService');
const embeddingService = require('./embeddingService');
const analyticsService = require('./analytics/AnalyticsService');
const prisma = new PrismaClient();

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
    // Initialize OpenAI client if API key is available
    this.openai = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        // Dynamic import for OpenAI (ESM module)
        // We'll use fetch API instead for compatibility
        this.hasOpenAI = true;
        this.apiKey = process.env.OPENAI_API_KEY;
        this.apiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
      } catch (error) {
        console.warn('OpenAI not available:', error.message);
        this.hasOpenAI = false;
      }
    } else {
      this.hasOpenAI = false;
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
      const model = output?.model || agent.config?.model || 'gpt-4';
      const cost = analyticsService.calculateCost(tokensUsed, model);

      // Update execution with result
      await prisma.agentExecution.update({
        where: { id: executionId },
        data: {
          status: 'COMPLETED',
          output,
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
        apiCalls: 1, // One API call to OpenAI
        tokensUsed,
        cost,
        status: 'COMPLETED',
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

      throw error;
    }
  }

  async executeLLMAgent(agent, input) {
    if (!this.hasOpenAI) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }

    const config = agent.config || {};
    const model = config.model || 'gpt-5.1';
    const temperature = config.temperature ?? 0.7;
    let systemPrompt = config.systemPrompt || 'You are a helpful AI assistant.';
    
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
    if (config.collectionId) {
      try {
        // Verify collection exists and belongs to user
        const collection = await prisma.collection.findUnique({
          where: { id: config.collectionId },
        });

        if (collection && collection.status === 'ACTIVE') {
          // Generate embedding for query
          const queryVector = await embeddingService.generateEmbedding(userQuery);
          
          // Search for similar vectors
          const searchResults = await vectorSearchService.search(
            config.collectionId,
            queryVector,
            {
              limit: config.ragLimit || 5, // Default to top 5 results
              minScore: config.ragMinScore || 0.5, // Minimum similarity score
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
        console.warn('RAG search failed, continuing without context:', error.message);
        // Continue execution without RAG context if search fails
      }
    }

    // Prepare messages
    const messages = [
      {
        role: 'system',
        content: systemPrompt + (ragContext ? '\n\n' + ragContext : ''),
      },
    ];

    // Add user input
    messages.push({
      role: 'user',
      content: userQuery,
    });

    // Call OpenAI API
    try {
      const response = await fetch(`${this.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
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
      
      return {
        output: data.choices[0]?.message?.content || '',
        usage: data.usage || {},
        model: data.model,
        finishReason: data.choices[0]?.finish_reason,
      };
    } catch (error) {
      if (error.message.includes('OpenAI API')) {
        throw error;
      }
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

