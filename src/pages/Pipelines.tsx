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
  Database,
  Zap,
  Settings,
  Edit,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  pipelinesAPI,
  type Pipeline,
  type CreatePipelineData,
  type UpdatePipelineData,
  type PipelineDefinition,
} from '@/lib/api/pipelines';
import { toast } from '@/hooks/use-toast';
import { PipelineBuilder } from '@/components/pipelines/PipelineBuilder';

const Pipelines = () => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [executeInput, setExecuteInput] = useState('');

  const [createFormData, setCreateFormData] = useState<CreatePipelineData>({
    name: '',
    description: '',
    status: 'DRAFT',
  });

  // Fetch pipelines
  const {
    data: pipelinesData,
    isLoading: pipelinesLoading,
    error: pipelinesError,
  } = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => pipelinesAPI.getPipelines(),
    enabled: !authLoading && !!user,
  });

  // Create pipeline mutation
  const createMutation = useMutation({
    mutationFn: (data: CreatePipelineData) => pipelinesAPI.createPipeline(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      setIsCreateDialogOpen(false);
      setCreateFormData({
        name: '',
        description: '',
        status: 'DRAFT',
      });
      toast({
        title: 'Success',
        description: 'Pipeline created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create pipeline',
        variant: 'destructive',
      });
    },
  });

  // Delete pipeline mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => pipelinesAPI.deletePipeline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({
        title: 'Success',
        description: 'Pipeline deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete pipeline',
        variant: 'destructive',
      });
    },
  });

  // Update pipeline status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED' }) =>
      pipelinesAPI.updatePipeline(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({
        title: 'Success',
        description: 'Pipeline status updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update pipeline',
        variant: 'destructive',
      });
    },
  });

  // Update pipeline definition mutation
  const updatePipelineMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePipelineData }) =>
      pipelinesAPI.updatePipeline(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      setIsBuilderOpen(false);
      setSelectedPipeline(null);
      toast({
        title: 'Success',
        description: 'Pipeline updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update pipeline',
        variant: 'destructive',
      });
    },
  });

  // Execute pipeline mutation
  const executeMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input?: any }) =>
      pipelinesAPI.executePipeline(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      setIsExecuteDialogOpen(false);
      setExecuteInput('');
      setSelectedPipeline(null);
      toast({
        title: 'Execution Started',
        description: 'Pipeline execution has been queued',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to execute pipeline',
        variant: 'destructive',
      });
    },
  });

  const handleCreatePipeline = () => {
    if (!createFormData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Pipeline name is required',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(createFormData);
  };

  const handleDeletePipeline = (id: string) => {
    if (window.confirm('Are you sure you want to delete this pipeline? All runs will be deleted.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (pipeline: Pipeline) => {
    let newStatus: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
    if (pipeline.status === 'ACTIVE') {
      newStatus = 'PAUSED';
    } else if (pipeline.status === 'PAUSED') {
      newStatus = 'ACTIVE';
    } else {
      newStatus = 'ACTIVE';
    }
    updateStatusMutation.mutate({ id: pipeline.id, status: newStatus });
  };

  const handleExecutePipeline = (pipeline: Pipeline) => {
    if (pipeline.status !== 'ACTIVE') {
      toast({
        title: 'Pipeline Not Active',
        description: 'Please activate the pipeline before executing',
        variant: 'destructive',
      });
      return;
    }
    setSelectedPipeline(pipeline);
    setExecuteInput('');
    setIsExecuteDialogOpen(true);
  };

  const handleConfirmExecute = () => {
    if (!selectedPipeline) return;
    
    let input;
    try {
      input = executeInput.trim() ? JSON.parse(executeInput) : {};
    } catch {
      // If not valid JSON, treat as string
      input = executeInput.trim() || {};
    }

    executeMutation.mutate({ id: selectedPipeline.id, input });
  };

  const handleOpenBuilder = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setIsBuilderOpen(true);
  };

  const handleSavePipeline = (definition: PipelineDefinition) => {
    if (!selectedPipeline) return;
    updatePipelineMutation.mutate({
      id: selectedPipeline.id,
      data: { definition },
    });
  };

  const handleCancelBuilder = () => {
    setIsBuilderOpen(false);
    setSelectedPipeline(null);
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

  const pipelines = pipelinesData?.data?.pipelines || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Data Pipelines</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Build and execute data processing pipelines with connectors and transformations
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Pipeline
          </Button>
        </div>

        {/* Error State */}
        {pipelinesError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Failed to load pipelines. Please try again.</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {pipelinesLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!pipelinesLoading && !pipelinesError && pipelines.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Database className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pipelines yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first data pipeline to process and transform data
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Pipeline
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pipelines Grid */}
        {!pipelinesLoading && !pipelinesError && pipelines.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pipelines.map((pipeline) => (
              <Card key={pipeline.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {pipeline.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${getStatusColor(pipeline.status)} text-white border-0`}
                    >
                      {pipeline.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pipeline._count && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Runs</span>
                        <span className="font-medium">{pipeline._count.runs}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Steps</span>
                      <span className="font-medium">
                        {pipeline.definition?.steps?.length || 0}
                      </span>
                    </div>
                    {pipeline.schedule && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Schedule</span>
                        <span className="font-medium text-xs">{pipeline.schedule}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenBuilder(pipeline)}
                        disabled={updatePipelineMutation.isPending}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {pipeline.status === 'ACTIVE' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleExecutePipeline(pipeline)}
                          disabled={executeMutation.isPending}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Execute
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(pipeline)}
                        disabled={updateStatusMutation.isPending}
                      >
                        {pipeline.status === 'ACTIVE' ? (
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
                        onClick={() => handleDeletePipeline(pipeline.id)}
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

        {/* Execute Pipeline Dialog */}
        <Dialog open={isExecuteDialogOpen} onOpenChange={setIsExecuteDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Execute Pipeline</DialogTitle>
              <DialogDescription>
                Run {selectedPipeline?.name} with custom input
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
                  setSelectedPipeline(null);
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

        {/* Create Pipeline Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Pipeline</DialogTitle>
              <DialogDescription>
                Create a new data pipeline to process and transform data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="My Pipeline"
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
                  placeholder="What does this pipeline do?"
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
              <Button onClick={handleCreatePipeline} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Pipeline'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pipeline Builder */}
        {isBuilderOpen && selectedPipeline && (
          <div className="fixed inset-0 z-50 bg-background">
            <PipelineBuilder
              pipelineDefinition={selectedPipeline.definition}
              onSave={handleSavePipeline}
              onCancel={handleCancelBuilder}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Pipelines;

