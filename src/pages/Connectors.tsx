import { useState, useEffect } from 'react';
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
  Trash2,
  Loader2,
  Database,
  TestTube,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { ConnectorLogo } from '@/components/connectors/ConnectorLogo';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  connectorsAPI,
  type Connector,
  type ConnectorType,
  type CreateConnectorData,
} from '@/lib/api/connectors';
import { toast } from '@/hooks/use-toast';

const Connectors = () => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ConnectorType | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Check for OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get('oauth');
    if (oauthStatus === 'success') {
      toast({
        title: 'Success',
        description: 'Connector connected successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      // Clean URL
      window.history.replaceState({}, '', '/connectors');
    } else if (oauthStatus === 'error') {
      toast({
        title: 'Error',
        description: params.get('message') || 'OAuth connection failed',
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/connectors');
    }
  }, [queryClient]);

  // Fetch connector types
  const { data: typesData } = useQuery({
    queryKey: ['connectorTypes'],
    queryFn: () => connectorsAPI.getConnectorTypes(),
    enabled: !!user && !authLoading,
  });

  // Fetch connectors
  const {
    data: connectorsData,
    isLoading: connectorsLoading,
    error: connectorsError,
  } = useQuery({
    queryKey: ['connectors'],
    queryFn: () => connectorsAPI.getConnectors(),
    enabled: !!user && !authLoading,
  });

  // Create connector mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateConnectorData) => connectorsAPI.createConnector(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      setIsCreateDialogOpen(false);
      setSelectedType(null);
      setFormData({});
      toast({
        title: 'Success',
        description: 'Connector created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create connector',
        variant: 'destructive',
      });
    },
  });

  // Delete connector mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => connectorsAPI.deleteConnector(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      toast({
        title: 'Success',
        description: 'Connector deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete connector',
        variant: 'destructive',
      });
    },
  });

  // Test connector mutation
  const testMutation = useMutation({
    mutationFn: (id: string) => connectorsAPI.testConnector(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      toast({
        title: response.data?.success ? 'Success' : 'Error',
        description: response.data?.message || 'Connection test completed',
        variant: response.data?.success ? 'default' : 'destructive',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to test connector',
        variant: 'destructive',
      });
    },
  });

  const handleCreateConnector = () => {
    if (!selectedType) {
      toast({
        title: 'Validation Error',
        description: 'Please select a connector type',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate({
      name: formData.name || `${selectedType.name} Connector`,
      type: selectedType.id,
      config: formData,
    });
  };

  const handleDeleteConnector = (id: string) => {
    if (window.confirm('Are you sure you want to delete this connector?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTestConnector = (id: string) => {
    testMutation.mutate(id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'INACTIVE':
        return 'bg-gray-500';
      case 'ERROR':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (authLoading || connectorsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const connectors = connectorsData?.data?.connectors || [];
  const types = typesData?.data?.types || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Connectors</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage data connectors for pipelines and workflows
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Connector
          </Button>
        </div>

        {/* Error State */}
        {connectorsError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Failed to load connectors. Please try again.</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!connectorsLoading && !connectorsError && connectors.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Database className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No connectors yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first connector to start building data pipelines
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Connector
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connectors Grid */}
        {!connectorsLoading && !connectorsError && connectors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectors.map((connector) => (
              <Card key={connector.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <ConnectorLogo type={connector.type} size={32} />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{connector.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {connector.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(connector.status)} text-white border-0`}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(connector.status)}
                        {connector.status}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {connector.lastError && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {connector.lastError}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Last Tested</span>
                      <span className="font-medium">
                        {connector.lastTested
                          ? new Date(connector.lastTested).toLocaleString()
                          : 'Never'}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnector(connector.id)}
                        disabled={testMutation.isPending}
                      >
                        <TestTube className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteConnector(connector.id)}
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

        {/* Create Connector Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Connector</DialogTitle>
              <DialogDescription>
                Select a connector type and configure it
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Connector Type *</Label>
                <Select
                  value={selectedType?.id || ''}
                  onValueChange={(value) => {
                    const type = types.find((t) => t.id === value);
                    setSelectedType(type || null);
                    setFormData({ name: type?.name || '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select connector type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedType && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder={selectedType.name}
                      value={formData.name || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  {selectedType.id === 's3' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="accessKeyId">Access Key ID *</Label>
                        <Input
                          id="accessKeyId"
                          type="password"
                          value={formData.accessKeyId || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, accessKeyId: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secretAccessKey">Secret Access Key *</Label>
                        <Input
                          id="secretAccessKey"
                          type="password"
                          value={formData.secretAccessKey || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, secretAccessKey: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bucket">Bucket Name *</Label>
                        <Input
                          id="bucket"
                          value={formData.bucket || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, bucket: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="region">Region</Label>
                        <Input
                          id="region"
                          placeholder="us-east-1"
                          value={formData.region || 'us-east-1'}
                          onChange={(e) =>
                            setFormData({ ...formData, region: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endpoint">Custom Endpoint (Optional, for MinIO)</Label>
                        <Input
                          id="endpoint"
                          placeholder="http://localhost:9000"
                          value={formData.endpoint || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, endpoint: e.target.value })
                          }
                        />
                      </div>
                    </>
                  )}

                  {selectedType.requiresOAuth && (
                    <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                      <p className="text-sm text-blue-800">
                        This connector requires OAuth authentication.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          if (!user?.id) {
                            toast({
                              title: 'Error',
                              description: 'Please log in to connect',
                              variant: 'destructive',
                            });
                            return;
                          }
                          
                          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                          const oauthUrl = selectedType.oauthProvider === 'google'
                            ? `${apiBaseUrl}/api/oauth/google/authorize?connectorType=${selectedType.id}&userId=${user.id}`
                            : `${apiBaseUrl}/api/oauth/slack/authorize?userId=${user.id}`;
                          
                          window.location.href = oauthUrl;
                        }}
                      >
                        Connect with {selectedType.oauthProvider === 'google' ? 'Google' : 'Slack'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setSelectedType(null);
                  setFormData({});
                }}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              {!selectedType?.requiresOAuth ? (
                <Button
                  onClick={handleCreateConnector}
                  disabled={createMutation.isPending || !selectedType}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Connector'
                  )}
                </Button>
              ) : (
                <div className="text-xs text-muted-foreground text-center">
                  Click "Connect with {selectedType.oauthProvider === 'google' ? 'Google' : 'Slack'}" above to authenticate
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Connectors;

