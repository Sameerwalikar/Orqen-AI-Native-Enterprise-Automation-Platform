import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';
import type { PipelineDefinition } from '@/lib/api/pipelines';

interface PipelineBuilderState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  isDirty: boolean;
  
  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setSelectedNode: (node: Node | null) => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
  deleteNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: any) => void;
  markDirty: () => void;
  markClean: () => void;
  reset: () => void;
}

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export const usePipelineBuilderStore = create<PipelineBuilderState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNode: null,
  isDirty: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  onNodesChange: (changes) => {
    const updatedNodes = applyNodeChanges(changes, get().nodes);
    // Auto-connect nodes sequentially for pipelines
    const newEdges = [];
    for (let i = 0; i < updatedNodes.length - 1; i++) {
      const sourceId = updatedNodes[i].id;
      const targetId = updatedNodes[i + 1].id;
      if (!get().edges.find(e => e.source === sourceId && e.target === targetId)) {
        newEdges.push({
          id: `edge-${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          type: 'smoothstep',
        });
      }
    }
    
    set({
      nodes: updatedNodes,
      edges: [...get().edges, ...newEdges],
      isDirty: true,
    });
  },
  
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    });
  },
  
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
      isDirty: true,
    });
  },
  
  setSelectedNode: (node) => set({ selectedNode: node }),
  
  addNode: (type, position) => {
    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position,
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        ...(type === 'connector' && { connector: null, config: {} }),
        ...(type === 'transform' && { transform: {} }),
        ...(type === 'filter' && { filter: {} }),
        ...(type === 'aggregate' && { aggregate: {} }),
        ...(type === 'agent' && { agentId: null }),
        ...(type === 'vector' && { operation: 'add', collectionId: null }),
      },
    };
    
    const updatedNodes = [...get().nodes, newNode];
    // Auto-connect sequentially
    const newEdges = [];
    for (let i = 0; i < updatedNodes.length - 1; i++) {
      const sourceId = updatedNodes[i].id;
      const targetId = updatedNodes[i + 1].id;
      if (!get().edges.find(e => e.source === sourceId && e.target === targetId)) {
        newEdges.push({
          id: `edge-${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          type: 'smoothstep',
        });
      }
    }
    
    set({
      nodes: updatedNodes,
      edges: [...get().edges, ...newEdges],
      isDirty: true,
    });
  },
  
  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      isDirty: true,
    });
  },
  
  updateNode: (nodeId, data) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
      isDirty: true,
    });
  },
  
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
  
  reset: () => set({
    nodes: initialNodes,
    edges: initialEdges,
    selectedNode: null,
    isDirty: false,
  }),
}));

