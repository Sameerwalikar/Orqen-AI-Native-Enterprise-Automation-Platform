import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';

const ConditionNode = memo(({ data }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-yellow-50 border-2 border-yellow-500 min-w-[150px]">
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-yellow-600" />
        <div className="font-bold text-yellow-700">{data.label || 'Condition'}</div>
      </div>
      {data.condition && (
        <div className="text-xs text-yellow-600 mt-1 truncate">{data.condition}</div>
      )}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3"
        style={{ left: '70%' }}
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';

export default ConditionNode;

