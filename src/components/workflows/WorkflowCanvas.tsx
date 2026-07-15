import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  Connection,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowBuilderStore } from '@/stores/workflowBuilderStore';
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import AgentNode from './nodes/AgentNode';
import ConditionNode from './nodes/ConditionNode';
import DelayNode from './nodes/DelayNode';
import TransformNode from './nodes/TransformNode';

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  agent: AgentNode,
  condition: ConditionNode,
  delay: DelayNode,
  transform: TransformNode,
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
};

export const WorkflowCanvas = () => {
  const nodes = useWorkflowBuilderStore((state) => state.nodes);
  const edges = useWorkflowBuilderStore((state) => state.edges);
  const onNodesChange = useWorkflowBuilderStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowBuilderStore((state) => state.onEdgesChange);
  const onConnect = useWorkflowBuilderStore((state) => state.onConnect);
  const setSelectedNode = useWorkflowBuilderStore((state) => state.setSelectedNode);
  const setSelectedEdge = useWorkflowBuilderStore((state) => state.setSelectedEdge);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      // Update selected node if it was changed
      changes.forEach((change) => {
        if (change.type === 'select' && change.selected) {
          const node = nodes.find((n) => n.id === change.id);
          if (node) setSelectedNode(node);
        } else if (change.type === 'select' && !change.selected) {
          setSelectedNode(null);
        }
      });
    },
    [onNodesChange, nodes, setSelectedNode]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      // Update selected edge if it was changed
      changes.forEach((change) => {
        if (change.type === 'select' && change.selected) {
          const edge = edges.find((e) => e.id === change.id);
          if (edge) setSelectedEdge(edge);
        } else if (change.type === 'select' && !change.selected) {
          setSelectedEdge(null);
        }
      });
    },
    [onEdgesChange, edges, setSelectedEdge]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection);
    },
    [onConnect]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right" className="bg-background p-2 rounded shadow">
          <div className="text-xs text-muted-foreground">
            {nodes.length} nodes, {edges.length} edges
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

