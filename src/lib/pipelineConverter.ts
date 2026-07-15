import { Node, Edge } from 'reactflow';
import type { PipelineDefinition, PipelineStep } from '@/lib/api/pipelines';

/**
 * Convert React Flow format to Backend Pipeline Definition format
 */
export function reactFlowToPipelineDefinition(
  nodes: Node[],
  edges: Edge[]
): PipelineDefinition {
  // Sort nodes by their position in the flow (top to bottom, left to right)
  const sortedNodes = [...nodes].sort((a, b) => {
    if (Math.abs(a.position.y - b.position.y) < 50) {
      return a.position.x - b.position.x;
    }
    return a.position.y - b.position.y;
  });

  const steps: PipelineStep[] = sortedNodes.map((node, index) => {
    const step: PipelineStep = {
      id: node.id,
      type: node.type as 'connector' | 'transform' | 'filter' | 'aggregate' | 'agent' | 'vector',
      label: node.data.label || node.type,
      ...(node.data.connector && { connector: node.data.connector }),
      ...(node.data.config && { config: node.data.config }),
      ...(node.data.transform && { transform: node.data.transform }),
      ...(node.data.filter && { filter: node.data.filter }),
      ...(node.data.aggregate && { aggregate: node.data.aggregate }),
      ...(node.data.agentId && { agentId: node.data.agentId }),
      ...(node.data.operation && { operation: node.data.operation }),
      ...(node.data.collectionId && { collectionId: node.data.collectionId }),
      ...(node.data.outputVariable && { outputVariable: node.data.outputVariable }),
      data: node.data,
    };
    return step;
  });

  return { steps };
}

/**
 * Convert Backend Pipeline Definition format to React Flow format
 */
export function pipelineDefinitionToReactFlow(
  definition: PipelineDefinition
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = definition.steps.map((step, index) => ({
    id: step.id,
    type: step.type,
    position: {
      x: 250,
      y: 100 + index * 150,
    },
    data: {
      label: step.label,
      ...(step.connector && { connector: step.connector }),
      ...(step.config && { config: step.config }),
      ...(step.transform && { transform: step.transform }),
      ...(step.filter && { filter: step.filter }),
      ...(step.aggregate && { aggregate: step.aggregate }),
      ...(step.agentId && { agentId: step.agentId }),
      ...(step.operation && { operation: step.operation }),
      ...(step.collectionId && { collectionId: step.collectionId }),
      ...(step.outputVariable && { outputVariable: step.outputVariable }),
      ...step.data,
    },
  }));

  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `edge-${nodes[i].id}-${nodes[i + 1].id}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      type: 'smoothstep',
      animated: false,
    });
  }

  return { nodes, edges };
}

/**
 * Validate pipeline definition
 */
export function validatePipeline(nodes: Node[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (nodes.length === 0) {
    errors.push('Pipeline must have at least one step');
    return { valid: false, errors };
  }

  // Check for at least one connector step
  const hasConnector = nodes.some((n) => n.type === 'connector');
  if (!hasConnector) {
    errors.push('Pipeline must have at least one connector step');
  }

  // Validate connector steps have connector type
  nodes.forEach((node) => {
    if (node.type === 'connector' && !node.data.connector) {
      errors.push(`Connector step "${node.data.label}" must have a connector type selected`);
    }
  });

  // Validate agent steps have agentId
  nodes.forEach((node) => {
    if (node.type === 'agent' && !node.data.agentId) {
      errors.push(`Agent step "${node.data.label}" must have an agent selected`);
    }
  });

  // Validate vector steps have collectionId
  nodes.forEach((node) => {
    if (node.type === 'vector' && !node.data.collectionId) {
      errors.push(`Vector step "${node.data.label}" must have a collection selected`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

