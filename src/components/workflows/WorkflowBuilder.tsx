import { useEffect } from 'react';
import { useWorkflowBuilderStore } from '@/stores/workflowBuilderStore';
import { workflowDefinitionToReactFlow, reactFlowToWorkflowDefinition, validateWorkflow } from '@/lib/workflowConverter';
import type { WorkflowDefinition } from '@/lib/api/workflows';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodePalette } from './NodePalette';
import { NodeEditor } from './NodeEditor';
import { Button } from '@/components/ui/button';
import { Save, X, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WorkflowBuilderProps {
  workflowDefinition?: WorkflowDefinition;
  onSave: (definition: WorkflowDefinition) => void;
  onCancel: () => void;
}

export const WorkflowBuilder = ({ workflowDefinition, onSave, onCancel }: WorkflowBuilderProps) => {
  const nodes = useWorkflowBuilderStore((state) => state.nodes);
  const edges = useWorkflowBuilderStore((state) => state.edges);
  const isDirty = useWorkflowBuilderStore((state) => state.isDirty);
  const setNodes = useWorkflowBuilderStore((state) => state.setNodes);
  const setEdges = useWorkflowBuilderStore((state) => state.setEdges);
  const markClean = useWorkflowBuilderStore((state) => state.markClean);
  const reset = useWorkflowBuilderStore((state) => state.reset);

  // Load workflow definition on mount
  useEffect(() => {
    if (workflowDefinition) {
      const { nodes: loadedNodes, edges: loadedEdges } = workflowDefinitionToReactFlow(workflowDefinition);
      setNodes(loadedNodes);
      setEdges(loadedEdges);
      markClean();
    } else {
      reset();
    }
  }, [workflowDefinition, setNodes, setEdges, markClean, reset]);

  const handleSave = () => {
    const validation = validateWorkflow(nodes, edges);
    
    if (!validation.valid) {
      toast({
        title: 'Validation Error',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    const definition = reactFlowToWorkflowDefinition(nodes, edges);
    onSave(definition);
    markClean();
    toast({
      title: 'Success',
      description: 'Workflow saved successfully',
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

  const validation = validateWorkflow(nodes, edges);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Workflow Builder</h2>
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
            Save Workflow
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Node Palette */}
        <div className="border-r bg-muted/50">
          <NodePalette />
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 relative">
          <WorkflowCanvas />
        </div>

        {/* Right Sidebar - Node Editor */}
        <div className="border-l bg-muted/50">
          <NodeEditor />
        </div>
      </div>
    </div>
  );
};

