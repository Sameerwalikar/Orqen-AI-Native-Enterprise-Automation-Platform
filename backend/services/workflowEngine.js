/**
 * Workflow Engine
 * Executes workflows defined as nodes and edges
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { executionQueue: agentExecutionQueue } = require('./agentExecutor');
const analyticsService = require('./analytics/AnalyticsService');

class WorkflowEngine {
  /**
   * Execute a workflow
   * @param {string} workflowId - Workflow ID
   * @param {object} input - Input data
   * @param {number} userId - User ID
   * @returns {Promise<object>} - Execution result
   */
  async execute(workflowId, input = {}, userId = null) {
    // Get workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (workflow.status !== 'ACTIVE') {
      throw new Error('Workflow is not active');
    }

    const definition = workflow.definition;
    const nodes = definition.nodes || [];
    const edges = definition.edges || [];

    // Find start node (node with no incoming edges)
    const startNode = nodes.find((node) => {
      const hasIncoming = edges.some((edge) => edge.target === node.id);
      return !hasIncoming && node.type === 'start';
    }) || nodes[0]; // Fallback to first node

    if (!startNode) {
      throw new Error('Workflow has no start node');
    }

    // Execution context
    const context = {
      input,
      variables: { ...input },
      currentNode: startNode.id,
      visitedNodes: new Set(),
      executionLog: [],
      userId: userId,
      startTime: Date.now(),
      agentExecutions: 0,
      apiCalls: 0,
      tokensUsed: 0,
    };

    // Execute workflow
    try {
      const result = await this.executeNode(startNode, nodes, edges, context);
      const duration = Date.now() - context.startTime;
      const cost = analyticsService.calculateCost(context.tokensUsed, 'gpt-4');

      // Record metrics
      await analyticsService.recordMetric({
        resourceType: 'workflow',
        resourceId: workflowId,
        executionId: `workflow-${workflowId}-${Date.now()}`,
        userId: userId || workflow.userId,
        organizationId: workflow.organizationId,
        duration,
        apiCalls: context.apiCalls,
        tokensUsed: context.tokensUsed,
        cost,
        status: 'COMPLETED',
      });

      return {
        success: true,
        output: result,
        logs: context.executionLog,
      };
    } catch (error) {
      const duration = Date.now() - context.startTime;

      // Record metrics (failed execution)
      await analyticsService.recordMetric({
        resourceType: 'workflow',
        resourceId: workflowId,
        executionId: `workflow-${workflowId}-${Date.now()}`,
        userId: userId || workflow.userId,
        organizationId: workflow.organizationId,
        duration,
        apiCalls: context.apiCalls,
        tokensUsed: context.tokensUsed,
        status: 'FAILED',
        errorType: error.constructor.name || 'Error',
      });

      return {
        success: false,
        error: error.message,
        logs: context.executionLog,
      };
    }
  }

  /**
   * Execute a single node
   * @param {object} node - Node to execute
   * @param {array} allNodes - All nodes in workflow
   * @param {array} edges - All edges in workflow
   * @param {object} context - Execution context
   * @returns {Promise<any>} - Node output
   */
  async executeNode(node, allNodes, edges, context) {
    // Prevent infinite loops
    if (context.visitedNodes.has(node.id)) {
      throw new Error(`Circular dependency detected at node ${node.id}`);
    }
    context.visitedNodes.add(node.id);

    context.executionLog.push({
      nodeId: node.id,
      nodeType: node.type,
      timestamp: new Date().toISOString(),
      message: `Executing ${node.type} node: ${node.label || node.id}`,
    });

    let output;

    try {
      switch (node.type) {
        case 'start':
          output = await this.executeStartNode(node, context);
          break;
        case 'end':
          output = await this.executeEndNode(node, context);
          break;
        case 'agent':
          output = await this.executeAgentNode(node, context);
          break;
        case 'condition':
          output = await this.executeConditionNode(node, context);
          break;
        case 'delay':
          output = await this.executeDelayNode(node, context);
          break;
        case 'transform':
          output = await this.executeTransformNode(node, context);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      context.executionLog.push({
        nodeId: node.id,
        nodeType: node.type,
        timestamp: new Date().toISOString(),
        message: `Completed ${node.type} node`,
        output,
      });

      // Update context variables
      if (node.data?.outputVariable) {
        context.variables[node.data.outputVariable] = output;
      }

      // Find next nodes
      const nextEdges = edges.filter((edge) => edge.source === node.id);
      
      if (nextEdges.length === 0) {
        // End of workflow
        return output;
      }

      // Execute next nodes (handle parallel execution)
      if (nextEdges.length === 1) {
        // Single path
        const nextNode = allNodes.find((n) => n.id === nextEdges[0].target);
        if (nextNode) {
          return await this.executeNode(nextNode, allNodes, edges, context);
        }
      } else {
        // Multiple paths (parallel execution)
        const nextNodes = nextEdges
          .map((edge) => allNodes.find((n) => n.id === edge.target))
          .filter(Boolean);

        const results = await Promise.all(
          nextNodes.map((nextNode) =>
            this.executeNode(
              { ...nextNode },
              allNodes,
              edges,
              { ...context, visitedNodes: new Set(context.visitedNodes) }
            )
          )
        );

        // Merge results
        return results.length === 1 ? results[0] : results;
      }

      return output;
    } catch (error) {
      context.executionLog.push({
        nodeId: node.id,
        nodeType: node.type,
        timestamp: new Date().toISOString(),
        error: error.message,
      });
      throw error;
    }
  }

  async executeStartNode(node, context) {
    return context.input;
  }

  async executeEndNode(node, context) {
    return context.variables;
  }

  async executeAgentNode(node, context) {
    const agentId = node.data?.agentId;
    if (!agentId) {
      throw new Error('Agent ID not specified in agent node');
    }

    // Get input for agent
    const agentInput = node.data?.input || context.variables;

    // Create agent execution
    const execution = await prisma.agentExecution.create({
      data: {
        agentId,
        userId: context.userId,
        status: 'PENDING',
        input: agentInput,
      },
    });

    // Queue agent execution
    await agentExecutionQueue.add({
      executionId: execution.id,
      agentId,
      userId: context.userId,
      input: agentInput,
    });

    // Wait for execution to complete (simplified - in production, use proper async handling)
    // For now, we'll poll
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

      const updatedExecution = await prisma.agentExecution.findUnique({
        where: { id: execution.id },
      });

      if (updatedExecution.status === 'COMPLETED') {
        context.agentExecutions++;
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

  async executeConditionNode(node, context) {
    const condition = node.data?.condition;
    if (!condition) {
      throw new Error('Condition not specified');
    }

    // Simple condition evaluation (can be enhanced)
    const { variable, operator, value } = condition;
    const variableValue = context.variables[variable];

    let result = false;

    switch (operator) {
      case 'equals':
        result = variableValue === value;
        break;
      case 'notEquals':
        result = variableValue !== value;
        break;
      case 'greaterThan':
        result = variableValue > value;
        break;
      case 'lessThan':
        result = variableValue < value;
        break;
      case 'contains':
        result = String(variableValue).includes(String(value));
        break;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }

    return { condition: result, value: variableValue };
  }

  async executeDelayNode(node, context) {
    const delayMs = node.data?.delayMs || 1000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return { delayed: delayMs };
  }

  async executeTransformNode(node, context) {
    const transform = node.data?.transform;
    if (!transform) {
      return context.variables;
    }

    // Simple transform (can be enhanced with more complex transformations)
    if (typeof transform === 'function') {
      // If transform is a function string, evaluate it
      // For security, this should be sandboxed in production
      return transform(context.variables);
    } else if (typeof transform === 'object') {
      // Map transform
      const result = {};
      for (const [key, value] of Object.entries(transform)) {
        if (typeof value === 'string' && value.startsWith('$')) {
          // Variable reference
          result[key] = context.variables[value.substring(1)];
        } else {
          result[key] = value;
        }
      }
      return result;
    }

    return context.variables;
  }
}

module.exports = new WorkflowEngine();

