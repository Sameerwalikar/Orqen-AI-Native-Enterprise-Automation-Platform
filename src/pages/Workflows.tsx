import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Play,
  Pause,
  Trash2,
  Loader2,
  Workflow as WorkflowIcon,
  Zap,
  Edit,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  workflowsAPI,
  type Workflow,
  type CreateWorkflowData,
  type UpdateWorkflowData,
} from '@/lib/api/workflows';
import { toast } from '@/hooks/use-toast';
import { WorkflowBuilder } from '@/components/workflows/WorkflowBuilder';
import type { WorkflowDefinition } from '@/lib/api/workflows';

const Workflows = () => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [executeInput, setExecuteInput] = useState('');

  const [createFormData, setCreateFormData] = useState<CreateWorkflowData>({
    name: '',
    description: '',
    status: 'DRAFT',
  });

  // Fetch workflows
  const {
    data: workflowsData,
    isLoading: workflowsLoading,
    error: workflowsError,
  } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowsAPI.getWorkflows(),
    enabled: !authLoading && !!user,
  });

  // Create workflow mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateWorkflowData) => workflowsAPI.createWorkflow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setIsCreateDialogOpen(false);
      setCreateFormData({
        name: '',
        description: '',
        status: 'DRAFT',
      });
      toast({
        title: 'Success',
        description: 'Workflow created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create workflow',
        variant: 'destructive',
      });
    },
  });

  // Delete workflow mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => workflowsAPI.deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: 'Success',
        description: 'Workflow deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete workflow',
        variant: 'destructive',
      });
    },
  });

  // Update workflow status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED' }) =>
      workflowsAPI.updateWorkflow(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: 'Success',
        description: 'Workflow status updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update workflow',
        variant: 'destructive',
      });
    },
  });

  // Update workflow definition mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkflowData }) =>
      workflowsAPI.updateWorkflow(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setIsBuilderOpen(false);
      setSelectedWorkflow(null);
      toast({
        title: 'Success',
        description: 'Workflow updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update workflow',
        variant: 'destructive',
      });
    },
  });

  // Execute workflow mutation
  const executeMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input?: any }) =>
      workflowsAPI.executeWorkflow(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setIsExecuteDialogOpen(false);
      setExecuteInput('');
      setSelectedWorkflow(null);
      toast({
        title: 'Execution Started',
        description: 'Workflow execution has been queued',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to execute workflow',
        variant: 'destructive',
      });
    },
  });

  const handleCreateWorkflow = () => {
    if (!createFormData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Workflow name is required',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(createFormData);
  };

  const handleDeleteWorkflow = (id: string) => {
    if (window.confirm('Are you sure you want to delete this workflow? All executions will be deleted.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (workflow: Workflow) => {
    let newStatus: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
    if (workflow.status === 'ACTIVE') {
      newStatus = 'PAUSED';
    } else if (workflow.status === 'PAUSED') {
      newStatus = 'ACTIVE';
    } else {
      newStatus = 'ACTIVE';
    }
    updateStatusMutation.mutate({ id: workflow.id, status: newStatus });
  };

  const handleExecuteWorkflow = (workflow: Workflow) => {
    if (workflow.status !== 'ACTIVE') {
      toast({
        title: 'Workflow Not Active',
        description: 'Please activate the workflow before executing',
        variant: 'destructive',
      });
      return;
    }
    setSelectedWorkflow(workflow);
    setExecuteInput('');
    setIsExecuteDialogOpen(true);
  };

  const handleConfirmExecute = () => {
    if (!selectedWorkflow) return;
    
    let input;
    try {
      input = executeInput.trim() ? JSON.parse(executeInput) : {};
    } catch {
      // If not valid JSON, treat as string
      input = executeInput.trim() || {};
    }

    executeMutation.mutate({ id: selectedWorkflow.id, input });
  };

  const handleOpenBuilder = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setIsBuilderOpen(true);
  };

  const handleSaveWorkflow = (definition: WorkflowDefinition) => {
    if (!selectedWorkflow) return;
    updateWorkflowMutation.mutate({
      id: selectedWorkflow.id,
      data: { definition },
    });
  };

  const handleCancelBuilder = () => {
    setIsBuilderOpen(false);
    setSelectedWorkflow(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'DRAFT':
        return 'bg-yellow-500';
      case 'PAUSED':
        return 'bg-orange-500';
      case 'ARCHIVED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const workflows = workflowsData?.data?.workflows || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Workflows</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Automate complex processes with multi-step workflows
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </div>

        {/* Error State */}
        {workflowsError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Failed to load workflows. Please try again.</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {workflowsLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!workflowsLoading && !workflowsError && workflows.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <WorkflowIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first workflow to automate processes
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workflows Grid */}
        {!workflowsLoading && !workflowsError && workflows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {workflow.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${getStatusColor(workflow.status)} text-white border-0`}
                    >
                      {workflow.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Version</span>
                      <span className="font-medium">{workflow.version}</span>
                    </div>
                    {workflow._count && (
                      <>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Executions</span>
                          <span className="font-medium">{workflow._count.executions}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Triggers</span>
                          <span className="font-medium">{workflow._count.triggers}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Nodes</span>
                      <span className="font-medium">
                        {workflow.definition?.nodes?.length || 0}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenBuilder(workflow)}
                        disabled={updateWorkflowMutation.isPending}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {workflow.status === 'ACTIVE' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleExecuteWorkflow(workflow)}
                          disabled={executeMutation.isPending}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Execute
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(workflow)}
                        disabled={updateStatusMutation.isPending}
                      >
                        {workflow.status === 'ACTIVE' ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Execute Workflow Dialog */}
        <Dialog open={isExecuteDialogOpen} onOpenChange={setIsExecuteDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Execute Workflow</DialogTitle>
              <DialogDescription>
                Run {selectedWorkflow?.name} with custom input
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="execute-input">Input (JSON, Optional)</Label>
                <Textarea
                  id="execute-input"
                  placeholder='{"key": "value"} or leave empty'
                  value={executeInput}
                  onChange={(e) => setExecuteInput(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Enter JSON input or leave empty for default
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsExecuteDialogOpen(false);
                  setSelectedWorkflow(null);
                  setExecuteInput('');
                }}
                disabled={executeMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmExecute} disabled={executeMutation.isPending}>
                {executeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Execute
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Workflow Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Create a new workflow to automate processes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="My Workflow"
                  value={createFormData.name}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What does this workflow do?"
                  value={createFormData.description}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={createFormData.status}
                  onValueChange={(value: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED') =>
                    setCreateFormData({ ...createFormData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateWorkflow} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Workflow'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Workflow Builder */}
        {isBuilderOpen && selectedWorkflow && (
          <div className="fixed inset-0 z-50 bg-background">
            <WorkflowBuilder
              workflowDefinition={selectedWorkflow.definition}
              onSave={handleSaveWorkflow}
              onCancel={handleCancelBuilder}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Workflows;

