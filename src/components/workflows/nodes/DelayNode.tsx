import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Clock } from 'lucide-react';

const DelayNode = memo(({ data }: NodeProps) => {
  const delay = data.delay || 1000;
  const delayText = delay >= 1000 ? `${delay / 1000}s` : `${delay}ms`;

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-purple-50 border-2 border-purple-500 min-w-[150px]">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-purple-600" />
        <div className="font-bold text-purple-700">{data.label || 'Delay'}</div>
      </div>
      <div className="text-xs text-purple-600 mt-1">{delayText}</div>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

DelayNode.displayName = 'DelayNode';

export default DelayNode;

