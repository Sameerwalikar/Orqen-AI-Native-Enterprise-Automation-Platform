import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { RefreshCw } from 'lucide-react';

const TransformNode = memo(({ data }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-indigo-50 border-2 border-indigo-500 min-w-[150px]">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-indigo-600" />
        <div className="font-bold text-indigo-700">{data.label || 'Transform'}</div>
      </div>
      {data.transform && Object.keys(data.transform).length > 0 && (
        <div className="text-xs text-indigo-600 mt-1">
          {Object.keys(data.transform).length} field(s)
        </div>
      )}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

TransformNode.displayName = 'TransformNode';

export default TransformNode;

