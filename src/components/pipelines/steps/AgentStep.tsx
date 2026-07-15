import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot } from 'lucide-react';

const AgentStep = memo(({ data }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-green-50 border-2 border-green-500 min-w-[150px]">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-green-600" />
        <div className="font-bold text-green-700">{data.label || 'Agent'}</div>
      </div>
      {data.agentName && (
        <div className="text-xs text-green-600 mt-1 truncate">{data.agentName}</div>
      )}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

AgentStep.displayName = 'AgentStep';

export default AgentStep;

