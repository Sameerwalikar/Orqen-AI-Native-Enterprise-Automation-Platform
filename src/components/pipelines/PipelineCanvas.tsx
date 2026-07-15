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
import { usePipelineBuilderStore } from '@/stores/pipelineBuilderStore';
import ConnectorStep from './steps/ConnectorStep';
import TransformStep from './steps/TransformStep';
import FilterStep from './steps/FilterStep';
import AggregateStep from './steps/AggregateStep';
import AgentStep from './steps/AgentStep';
import VectorStep from './steps/VectorStep';

const nodeTypes = {
  connector: ConnectorStep,
  transform: TransformStep,
  filter: FilterStep,
  aggregate: AggregateStep,
  agent: AgentStep,
  vector: VectorStep,
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
};

export const PipelineCanvas = () => {
  const nodes = usePipelineBuilderStore((state) => state.nodes);
  const edges = usePipelineBuilderStore((state) => state.edges);
  const onNodesChange = usePipelineBuilderStore((state) => state.onNodesChange);
  const onEdgesChange = usePipelineBuilderStore((state) => state.onEdgesChange);
  const onConnect = usePipelineBuilderStore((state) => state.onConnect);
  const setSelectedNode = usePipelineBuilderStore((state) => state.setSelectedNode);

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
    },
    [onEdgesChange]
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
        nodesDraggable
        nodesConnectable
        elementsSelectable
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right" className="bg-background p-2 rounded shadow">
          <div className="text-xs text-muted-foreground">
            {nodes.length} step{nodes.length !== 1 ? 's' : ''}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

