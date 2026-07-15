import { useCallback } from 'react';
import { usePipelineBuilderStore } from '@/stores/pipelineBuilderStore';
import { Database, RefreshCw, Filter, BarChart3, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stepTypes = [
  { type: 'connector', label: 'Connector', icon: Database, color: 'text-blue-600' },
  { type: 'transform', label: 'Transform', icon: RefreshCw, color: 'text-indigo-600' },
  { type: 'filter', label: 'Filter', icon: Filter, color: 'text-yellow-600' },
  { type: 'aggregate', label: 'Aggregate', icon: BarChart3, color: 'text-purple-600' },
  { type: 'agent', label: 'Agent', icon: Bot, color: 'text-green-600' },
  { type: 'vector', label: 'Vector', icon: Database, color: 'text-cyan-600' },
];

export const StepPalette = () => {
  const addNode = usePipelineBuilderStore((state) => state.addNode);

  const handleAddStep = useCallback(
    (type: string) => {
      // Add step at bottom of existing steps
      const nodes = usePipelineBuilderStore.getState().nodes;
      const position = {
        x: 250,
        y: nodes.length > 0 ? Math.max(...nodes.map(n => n.position.y)) + 150 : 100,
      };
      addNode(type, position);
    },
    [addNode]
  );

  return (
    <Card className="w-64 h-full">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Step Types</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stepTypes.map((stepType) => {
          const Icon = stepType.icon;
          return (
            <Button
              key={stepType.type}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAddStep(stepType.type)}
            >
              <Icon className={`h-4 w-4 mr-2 ${stepType.color}`} />
              {stepType.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

