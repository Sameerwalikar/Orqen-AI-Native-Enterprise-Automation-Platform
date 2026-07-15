import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Zap,
  Bot,
  Workflow as WorkflowIcon,
  GitBranch,
  Database,
  Calendar,
  Webhook as WebhookIcon,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { analyticsAPI, type AnalyticsOverview } from '@/lib/api/analytics';
import { agentsAPI, type Agent } from '@/lib/api/agents';
import { workflowsAPI, type Workflow } from '@/lib/api/workflows';
import { pipelinesAPI, type Pipeline } from '@/lib/api/pipelines';
import { connectorsAPI, type Connector } from '@/lib/api/connectors';
import { vectorsAPI, type Collection } from '@/lib/api/vectors';
import { schedulesAPI, type Schedule } from '@/lib/api/schedules';
import { webhooksAPI, type Webhook } from '@/lib/api/webhooks';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isConnected } = useWebSocket();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState<string | undefined>();

  // Fetch analytics overview (last 7 days)
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview', organizationId, '7days'],
    queryFn: () =>
      analyticsAPI.getOverview(
        organizationId,
        format(subDays(new Date(), 7), 'yyyy-MM-dd'),
        format(new Date(), 'yyyy-MM-dd')
      ),
    enabled: !!user && !authLoading,
  });

  // Fetch usage trends (last 7 days)
  const { data: trendsData } = useQuery({
    queryKey: ['analytics', 'trends', organizationId, 7],
    queryFn: () => analyticsAPI.getTrends(organizationId, 7),
    enabled: !!user && !authLoading,
  });

  // Fetch resource counts
  const { data: agentsData } = useQuery({
    queryKey: ['agents', organizationId],
    queryFn: () => agentsAPI.getAgents({ organizationId }),
    enabled: !!user && !authLoading,
  });

  const { data: workflowsData } = useQuery({
    queryKey: ['workflows', organizationId],
    queryFn: () => workflowsAPI.getWorkflows({ organizationId }),
    enabled: !!user && !authLoading,
  });

  const { data: pipelinesData } = useQuery({
    queryKey: ['pipelines', organizationId],
    queryFn: () => pipelinesAPI.getPipelines({ organizationId }),
    enabled: !!user && !authLoading,
  });

  const { data: connectorsData } = useQuery({
    queryKey: ['connectors'],
    queryFn: () => connectorsAPI.getConnectors(),
    enabled: !!user && !authLoading,
  });

  const { data: collectionsData } = useQuery({
    queryKey: ['collections'],
    queryFn: () => vectorsAPI.getCollections(),
    enabled: !!user && !authLoading,
  });

  const { data: schedulesData } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulesAPI.getSchedules(),
    enabled: !!user && !authLoading,
  });

  const { data: webhooksData } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => webhooksAPI.getWebhooks(),
    enabled: !!user && !authLoading,
  });

  // Fetch recent executions (from analytics metrics)
  const { data: recentMetricsData } = useQuery({
    queryKey: ['analytics', 'metrics', organizationId, 'recent'],
    queryFn: () => analyticsAPI.getMetrics(organizationId, undefined, undefined, undefined, undefined, 10),
    enabled: !!user && !authLoading,
  });

  const { socket } = useWebSocket();

  // Listen for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    };

    socket.on('analytics:update', handleUpdate);
    socket.on('metric:update', handleUpdate);

    return () => {
      socket.off('analytics:update', handleUpdate);
      socket.off('metric:update', handleUpdate);
    };
  }, [socket, isConnected, queryClient]);

  if (authLoading || overviewLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const overview: AnalyticsOverview | undefined = overviewData?.data?.overview;
  const trends: any[] = trendsData?.data?.trends || [];
  const agents: Agent[] = agentsData?.data?.agents || [];
  const workflows: Workflow[] = workflowsData?.data?.workflows || [];
  const pipelines: Pipeline[] = pipelinesData?.data?.pipelines || [];
  const connectors: Connector[] = connectorsData?.data?.connectors || [];
  const collections: Collection[] = collectionsData?.data?.collections || [];
  const schedules: Schedule[] = schedulesData?.data?.schedules || [];
  const webhooks: Webhook[] = webhooksData?.data?.webhooks || [];
  const recentMetrics: any[] = recentMetricsData?.data?.metrics || [];

  const activeAgents = agents.filter((a) => a.status === 'ACTIVE').length;
  const activeWorkflows = workflows.filter((w) => w.status === 'ACTIVE').length;
  const activePipelines = pipelines.filter((p) => p.status === 'ACTIVE').length;
  const enabledSchedules = schedules.filter((s) => s.enabled).length;
  const enabledWebhooks = webhooks.filter((w) => w.enabled).length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'RUNNING':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'agent':
        return 'Agent';
      case 'workflow':
        return 'Workflow';
      case 'pipeline':
        return 'Pipeline';
      default:
        return type;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Here's what's happening with your platform today
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline">
                <div className="h-2 w-2 rounded-full bg-gray-400 mr-2" />
                Offline
              </Badge>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalExecutions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days • {overview.successfulExecutions} successful
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.successRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.failedExecutions} failed executions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${overview.totalCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.totalTokens.toLocaleString()} tokens used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(overview.avgDuration / 1000).toFixed(1)}s</div>
                <p className="text-xs text-muted-foreground mt-1">Average execution time</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resource Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resource Summary</CardTitle>
                  <CardDescription>Your platform resources at a glance</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/agents')}>
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">Agents</span>
                  </div>
                  <div className="text-2xl font-bold">{agents.length}</div>
                  <p className="text-xs text-muted-foreground">{activeAgents} active</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <WorkflowIcon className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-medium">Workflows</span>
                  </div>
                  <div className="text-2xl font-bold">{workflows.length}</div>
                  <p className="text-xs text-muted-foreground">{activeWorkflows} active</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">Pipelines</span>
                  </div>
                  <div className="text-2xl font-bold">{pipelines.length}</div>
                  <p className="text-xs text-muted-foreground">{activePipelines} active</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium">Vectors</span>
                  </div>
                  <div className="text-2xl font-bold">{collections.length}</div>
                  <p className="text-xs text-muted-foreground">Collections</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium">Connectors</span>
                  </div>
                  <div className="text-2xl font-bold">{connectors.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {connectors.filter((c) => c.status === 'ACTIVE').length} active
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    <span className="text-sm font-medium">Schedules</span>
                  </div>
                  <div className="text-2xl font-bold">{schedules.length}</div>
                  <p className="text-xs text-muted-foreground">{enabledSchedules} enabled</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <WebhookIcon className="h-5 w-5 text-pink-500" />
                    <span className="text-sm font-medium">Webhooks</span>
                  </div>
                  <div className="text-2xl font-bold">{webhooks.length}</div>
                  <p className="text-xs text-muted-foreground">{enabledWebhooks} enabled</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium">Total</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {agents.length + workflows.length + pipelines.length + collections.length + connectors.length + schedules.length + webhooks.length}
                  </div>
                  <p className="text-xs text-muted-foreground">All resources</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Create new resources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/agents?create=true')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/workflows?create=true')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/pipelines?create=true')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Pipeline
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/vectors?create=true')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Collection
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/connectors?create=true')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Connector
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usage Trends (Mini Chart) */}
          {trends.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Usage Trends</CardTitle>
                    <CardDescription>Last 7 days</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/analytics')}>
                    View Details
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip
                      labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="agentsExecuted"
                      stroke="#0088FE"
                      name="Agents"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="workflowsExecuted"
                      stroke="#00C49F"
                      name="Workflows"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="pipelinesExecuted"
                      stroke="#FFBB28"
                      name="Pipelines"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest executions</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/analytics')}>
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentMetrics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs mt-1">Execute an agent, workflow, or pipeline to see activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMetrics.slice(0, 5).map((metric) => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(metric.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {getResourceTypeLabel(metric.resourceType)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(metric.createdAt), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {metric.status === 'COMPLETED' && metric.duration && (
                          <span className="text-xs text-muted-foreground">
                            {(metric.duration / 1000).toFixed(1)}s
                          </span>
                        )}
                        {metric.status === 'FAILED' && (
                          <Badge variant="destructive" className="text-xs">
                            Failed
                          </Badge>
                        )}
                        {metric.status === 'COMPLETED' && (
                          <Badge variant="outline" className="text-xs border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                            Success
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts / Failed Executions */}
        {overview && overview.failedExecutions > 0 && (
          <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <CardTitle className="text-yellow-900 dark:text-yellow-100">Attention Required</CardTitle>
              </div>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                You have {overview.failedExecutions} failed execution{overview.failedExecutions > 1 ? 's' : ''} in the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="border-yellow-300 dark:border-yellow-700"
                onClick={() => navigate('/analytics')}
              >
                View Error Analysis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
