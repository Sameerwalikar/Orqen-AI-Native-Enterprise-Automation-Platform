import { useEffect } from 'react';
import { usePipelineBuilderStore } from '@/stores/pipelineBuilderStore';
import { pipelineDefinitionToReactFlow, reactFlowToPipelineDefinition, validatePipeline } from '@/lib/pipelineConverter';
import type { PipelineDefinition } from '@/lib/api/pipelines';
import { PipelineCanvas } from './PipelineCanvas';
import { StepPalette } from './StepPalette';
import { StepEditor } from './StepEditor';
import { Button } from '@/components/ui/button';
import { Save, X, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PipelineBuilderProps {
  pipelineDefinition?: PipelineDefinition;
  onSave: (definition: PipelineDefinition) => void;
  onCancel: () => void;
}

export const PipelineBuilder = ({ pipelineDefinition, onSave, onCancel }: PipelineBuilderProps) => {
  const nodes = usePipelineBuilderStore((state) => state.nodes);
  const edges = usePipelineBuilderStore((state) => state.edges);
  const isDirty = usePipelineBuilderStore((state) => state.isDirty);
  const setNodes = usePipelineBuilderStore((state) => state.setNodes);
  const setEdges = usePipelineBuilderStore((state) => state.setEdges);
  const markClean = usePipelineBuilderStore((state) => state.markClean);
  const reset = usePipelineBuilderStore((state) => state.reset);

  // Load pipeline definition on mount
  useEffect(() => {
    if (pipelineDefinition) {
      const { nodes: loadedNodes, edges: loadedEdges } = pipelineDefinitionToReactFlow(pipelineDefinition);
      setNodes(loadedNodes);
      setEdges(loadedEdges);
      markClean();
    } else {
      reset();
    }
  }, [pipelineDefinition, setNodes, setEdges, markClean, reset]);

  const handleSave = () => {
    const validation = validatePipeline(nodes);
    
    if (!validation.valid) {
      toast({
        title: 'Validation Error',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    const definition = reactFlowToPipelineDefinition(nodes, edges);
    onSave(definition);
    markClean();
    toast({
      title: 'Success',
      description: 'Pipeline saved successfully',
    });
  };

  const handleCancel = () => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        return;
      }
    }
    reset();
    onCancel();
  };

  const validation = validatePipeline(nodes);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Pipeline Builder</h2>
          {!validation.valid && (
            <Alert variant="destructive" className="py-1 px-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {validation.errors[0]}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!validation.valid || !isDirty}>
            <Save className="h-4 w-4 mr-2" />
            Save Pipeline
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Step Palette */}
        <div className="border-r bg-muted/50">
          <StepPalette />
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 relative">
          <PipelineCanvas />
        </div>

        {/* Right Sidebar - Step Editor */}
        <div className="border-l bg-muted/50">
          <StepEditor />
        </div>
      </div>
    </div>
  );
};

