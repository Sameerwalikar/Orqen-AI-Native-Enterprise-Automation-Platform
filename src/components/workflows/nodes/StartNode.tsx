import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play } from 'lucide-react';

const StartNode = memo(({ data }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-green-50 border-2 border-green-500 min-w-[120px]">
      <div className="flex items-center gap-2">
        <Play className="h-4 w-4 text-green-600" />
        <div className="font-bold text-green-700">{data.label || 'Start'}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

StartNode.displayName = 'StartNode';

export default StartNode;

