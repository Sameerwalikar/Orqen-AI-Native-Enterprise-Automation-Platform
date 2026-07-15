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
import { Plus, Play, Pause, Trash2, Loader2, Bot, Zap, Clock, CheckCircle2, XCircle, Database } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { agentsAPI, type Agent, type CreateAgentData } from '@/lib/api/agents';
import { vectorsAPI } from '@/lib/api/vectors';
import { toast } from '@/hooks/use-toast';

const Agents = () => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [executeInput, setExecuteInput] = useState('');
  const [executingExecutionId, setExecutingExecutionId] = useState<string | null>(null);
  const [createFormData, setCreateFormData] = useState<CreateAgentData>({
    name: '',
    description: '',
    status: 'DRAFT',
    config: {
      type: 'llm',
      model: 'gpt-4',
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
    },
  });

  // Fetch agents
  const {
    data: agentsData,
    isLoading: agentsLoading,
    error: agentsError,
  } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsAPI.getAgents(),
    enabled: !authLoading && !!user,
  });

  // Fetch collections for RAG selection
  const {
    data: collectionsData,
  } = useQuery({
    queryKey: ['collections'],
    queryFn: () => vectorsAPI.getCollections({ status: 'ACTIVE' }),
    enabled: !authLoading && !!user,
  });

  // Create agent mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateAgentData) => agentsAPI.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setIsCreateDialogOpen(false);
      setCreateFormData({
        name: '',
        description: '',
        status: 'DRAFT',
        config: {
          type: 'llm',
          model: 'gpt-4',
          temperature: 0.7,
          systemPrompt: 'You are a helpful AI assistant.',
        },
      });
      toast({
        title: 'Success',
        description: 'Agent created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create agent',
        variant: 'destructive',
      });
    },
  });

  // Delete agent mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentsAPI.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: 'Success',
        description: 'Agent deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete agent',
        variant: 'destructive',
      });
    },
  });

  // Update agent status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' }) =>
      agentsAPI.updateAgent(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: 'Success',
        description: 'Agent status updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update agent',
        variant: 'destructive',
      });
    },
  });

  // Execute agent mutation
  const executeMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input?: any }) =>
      agentsAPI.executeAgent(id, { input }),
    onSuccess: (data) => {
      const executionId = data.data.execution.id;
      setExecutingExecutionId(executionId);
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: 'Execution Started',
        description: 'Agent execution has been queued',
      });
      // Start polling for execution status
      startExecutionPolling(executionId);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to execute agent',
        variant: 'destructive',
      });
    },
  });

  // Poll execution status
  const startExecutionPolling = (executionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        // Get agent executions to check status
        if (selectedAgent) {
          const executions = await agentsAPI.getAgentExecutions(selectedAgent.id, { limit: 1 });
          const execution = executions.data.executions.find((e) => e.id === executionId);
          
          if (execution && (execution.status === 'COMPLETED' || execution.status === 'FAILED')) {
            clearInterval(pollInterval);
            setExecutingExecutionId(null);
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            
            if (execution.status === 'COMPLETED') {
              toast({
                title: 'Execution Completed',
                description: 'Agent execution finished successfully',
              });
            } else {
              toast({
                title: 'Execution Failed',
                description: execution.error || 'Agent execution failed',
                variant: 'destructive',
              });
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Clear interval after 5 minutes (safety timeout)
    setTimeout(() => {
      clearInterval(pollInterval);
      setExecutingExecutionId(null);
    }, 5 * 60 * 1000);
  };

  const handleCreateAgent = () => {
    if (!createFormData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Agent name is required',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(createFormData);
  };

  const handleDeleteAgent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (agent: Agent) => {
    const newStatus = agent.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    updateStatusMutation.mutate({ id: agent.id, status: newStatus });
  };

  const handleExecuteAgent = (agent: Agent) => {
    if (agent.status !== 'ACTIVE') {
      toast({
        title: 'Agent Not Active',
        description: 'Please activate the agent before executing',
        variant: 'destructive',
      });
      return;
    }
    setSelectedAgent(agent);
    setExecuteInput('');
    setIsExecuteDialogOpen(true);
  };

  const handleConfirmExecute = () => {
    if (!selectedAgent) return;
    
    const input = executeInput.trim() || undefined;
    executeMutation.mutate({ id: selectedAgent.id, input });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'DRAFT':
        return 'bg-yellow-500';
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

  const agents = agentsData?.data?.agents || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Agents</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your AI agents and automations
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        </div>

        {/* Error State */}
        {agentsError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">
                Failed to load agents. Please try again.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {agentsLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!agentsLoading && !agentsError && agents.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first AI agent to get started
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agents Grid */}
        {!agentsLoading && !agentsError && agents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          {agent.config?.collectionId && (
                            <Badge variant="outline" className="text-xs">
                              <Database className="h-3 w-3 mr-1" />
                              RAG
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {agent.description || 'No description'}
                        </CardDescription>
                      </div>
                      <Badge
                        className={`${getStatusColor(agent.status)} text-white border-0`}
                      >
                        {agent.status}
                      </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Version</span>
                      <span className="font-medium">{agent.version}</span>
                    </div>
                    {agent._count && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Executions</span>
                        <span className="font-medium">{agent._count.executions}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      {agent.status === 'ACTIVE' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleExecuteAgent(agent)}
                          disabled={executeMutation.isPending || executingExecutionId !== null}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Execute
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(agent)}
                        disabled={updateStatusMutation.isPending}
                      >
                        {agent.status === 'ACTIVE' ? (
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
                        onClick={() => handleDeleteAgent(agent.id)}
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

        {/* Execute Agent Dialog */}
        <Dialog open={isExecuteDialogOpen} onOpenChange={setIsExecuteDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Execute Agent</DialogTitle>
              <DialogDescription>
                Run {selectedAgent?.name} with custom input
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="execute-input">Input (Optional)</Label>
                <Textarea
                  id="execute-input"
                  placeholder="Enter your input or leave empty for default..."
                  value={executeInput}
                  onChange={(e) => setExecuteInput(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  For LLM agents, this will be sent as the user message. Leave empty for a default prompt.
                </p>
              </div>
              {executingExecutionId && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm">Execution in progress...</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsExecuteDialogOpen(false);
                  setSelectedAgent(null);
                  setExecuteInput('');
                }}
                disabled={executeMutation.isPending || executingExecutionId !== null}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmExecute}
                disabled={executeMutation.isPending || executingExecutionId !== null}
              >
                {executeMutation.isPending || executingExecutionId ? (
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

        {/* Create Agent Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
              <DialogDescription>
                Create a new AI agent with custom configuration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="My AI Agent"
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
                  placeholder="What does this agent do?"
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
                  onValueChange={(value: 'DRAFT' | 'ACTIVE' | 'ARCHIVED') =>
                    setCreateFormData({ ...createFormData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select
                  value={createFormData.config?.model || 'gpt-4'}
                  onValueChange={(value) =>
                    setCreateFormData({
                      ...createFormData,
                      config: { ...createFormData.config, model: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection">RAG Collection (Optional)</Label>
                <Select
                  value={createFormData.config?.collectionId ? createFormData.config.collectionId : 'none'}
                  onValueChange={(value) => {
                    const newConfig = { ...createFormData.config };
                    if (value === 'none') {
                      delete newConfig.collectionId;
                    } else {
                      newConfig.collectionId = value;
                    }
                    setCreateFormData({
                      ...createFormData,
                      config: newConfig,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a collection for RAG" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (No RAG)</SelectItem>
                    {(collectionsData?.data?.collections || [])
                      .filter((c) => c.status === 'ACTIVE')
                      .map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.name} ({collection.vectorCount || 0} vectors)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Enable RAG to search your vector collections and use context in responses
                </p>
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
              <Button onClick={handleCreateAgent} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Agent'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Agents;

