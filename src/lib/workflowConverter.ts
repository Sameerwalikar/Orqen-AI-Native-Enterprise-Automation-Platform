import { Node, Edge } from 'reactflow';
import type { WorkflowDefinition } from '@/lib/api/workflows';

/**
 * Convert React Flow format to Backend Workflow Definition format
 */
export function reactFlowToWorkflowDefinition(
  nodes: Node[],
  edges: Edge[]
): WorkflowDefinition {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type as 'start' | 'end' | 'agent' | 'condition' | 'delay' | 'transform',
      label: node.data.label || node.type,
      position: node.position,
      data: node.data,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label as string | undefined,
    })),
  };
}

/**
 * Convert Backend Workflow Definition format to React Flow format
 */
export function workflowDefinitionToReactFlow(
  definition: WorkflowDefinition
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = definition.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      label: node.label,
      ...node.data,
    },
  }));

  const edges: Edge[] = definition.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: 'smoothstep',
    animated: false,
  }));

  return { nodes, edges };
}

/**
 * Validate workflow definition
 */
export function validateWorkflow(nodes: Node[], edges: Edge[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for at least one start node
  const startNodes = nodes.filter((n) => n.type === 'start');
  if (startNodes.length === 0) {
    errors.push('Workflow must have at least one start node');
  }
  if (startNodes.length > 1) {
    errors.push('Workflow can only have one start node');
  }

  // Check for at least one end node
  const endNodes = nodes.filter((n) => n.type === 'end');
  if (endNodes.length === 0) {
    errors.push('Workflow must have at least one end node');
  }

  // Check for orphaned nodes (nodes with no connections)
  const connectedNodeIds = new Set<string>();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  nodes.forEach((node) => {
    if (node.type !== 'start' && node.type !== 'end' && !connectedNodeIds.has(node.id)) {
      errors.push(`Node "${node.data.label}" is not connected`);
    }
  });

  // Check for cycles (simple check - nodes shouldn't connect back to themselves)
  edges.forEach((edge) => {
    if (edge.source === edge.target) {
      errors.push(`Node "${edge.source}" cannot connect to itself`);
    }
  });

  // Validate agent nodes have agentId
  nodes.forEach((node) => {
    if (node.type === 'agent' && !node.data.agentId) {
      errors.push(`Agent node "${node.data.label}" must have an agent selected`);
    }
  });

  // Validate condition nodes have condition
  nodes.forEach((node) => {
    if (node.type === 'condition' && !node.data.condition) {
      errors.push(`Condition node "${node.data.label}" must have a condition defined`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

