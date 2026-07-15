import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Filter } from 'lucide-react';

const FilterStep = memo(({ data }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-yellow-50 border-2 border-yellow-500 min-w-[150px]">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-yellow-600" />
        <div className="font-bold text-yellow-700">{data.label || 'Filter'}</div>
      </div>
      {data.filter && Object.keys(data.filter).length > 0 && (
        <div className="text-xs text-yellow-600 mt-1">Filter active</div>
      )}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

FilterStep.displayName = 'FilterStep';

export default FilterStep;

