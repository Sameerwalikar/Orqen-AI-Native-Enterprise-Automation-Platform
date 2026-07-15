import { useCallback } from 'react';
import { useWorkflowBuilderStore } from '@/stores/workflowBuilderStore';
import { Bot, GitBranch, Clock, RefreshCw, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const nodeTypes = [
  { type: 'start', label: 'Start', icon: Play, color: 'text-green-600' },
  { type: 'end', label: 'End', icon: Square, color: 'text-red-600' },
  { type: 'agent', label: 'Agent', icon: Bot, color: 'text-blue-600' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: 'text-yellow-600' },
  { type: 'delay', label: 'Delay', icon: Clock, color: 'text-purple-600' },
  { type: 'transform', label: 'Transform', icon: RefreshCw, color: 'text-indigo-600' },
];

export const NodePalette = () => {
  const addNode = useWorkflowBuilderStore((state) => state.addNode);

  const handleAddNode = useCallback(
    (type: string) => {
      // Add node at center of viewport (approximate)
      const position = {
        x: Math.random() * 400 + 200,
        y: Math.random() * 300 + 150,
      };
      addNode(type, position);
    },
    [addNode]
  );

  return (
    <Card className="w-64 h-full">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Node Types</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {nodeTypes.map((nodeType) => {
          const Icon = nodeType.icon;
          return (
            <Button
              key={nodeType.type}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAddNode(nodeType.type)}
            >
              <Icon className={`h-4 w-4 mr-2 ${nodeType.color}`} />
              {nodeType.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

