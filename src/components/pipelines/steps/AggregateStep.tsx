import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BarChart3 } from 'lucide-react';

const AggregateStep = memo(({ data }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-purple-50 border-2 border-purple-500 min-w-[150px]">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-purple-600" />
        <div className="font-bold text-purple-700">{data.label || 'Aggregate'}</div>
      </div>
      {data.aggregate?.operation && (
        <div className="text-xs text-purple-600 mt-1">{data.aggregate.operation}</div>
      )}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

AggregateStep.displayName = 'AggregateStep';

export default AggregateStep;

