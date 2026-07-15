import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Square } from 'lucide-react';

const EndNode = memo(({ data }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-red-50 border-2 border-red-500 min-w-[120px]">
      <div className="flex items-center gap-2">
        <Square className="h-4 w-4 text-red-600" />
        <div className="font-bold text-red-700">{data.label || 'End'}</div>
      </div>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
    </div>
  );
});

EndNode.displayName = 'EndNode';

export default EndNode;

