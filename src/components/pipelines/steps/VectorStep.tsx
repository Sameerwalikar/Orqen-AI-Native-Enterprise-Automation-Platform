import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database } from 'lucide-react';

const VectorStep = memo(({ data }: NodeProps) => {
  const operation = data.operation || 'add';
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-cyan-50 border-2 border-cyan-500 min-w-[150px]">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-cyan-600" />
        <div className="font-bold text-cyan-700">{data.label || 'Vector'}</div>
      </div>
      <div className="text-xs text-cyan-600 mt-1 capitalize">{operation}</div>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

VectorStep.displayName = 'VectorStep';

export default VectorStep;

