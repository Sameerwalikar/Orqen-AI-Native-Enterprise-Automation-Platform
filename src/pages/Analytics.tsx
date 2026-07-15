import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Zap,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { analyticsAPI, type AnalyticsOverview, type UsageTrend, type ResourceBreakdown, type ErrorAnalysis } from '@/lib/api/analytics';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

const Analytics = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { socket, isConnected } = useWebSocket();
  const queryClient = useQueryClient();
  const [days, setDays] = useState(30);
  const [organizationId, setOrganizationId] = useState<string | undefined>();

  // Fetch analytics overview
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview', organizationId, days],
    queryFn: () => analyticsAPI.getOverview(organizationId, format(subDays(new Date(), days), 'yyyy-MM-dd'), format(new Date(), 'yyyy-MM-dd')),
    enabled: !!user && !authLoading,
  });

  // Fetch usage trends
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics', 'trends', organizationId, days],
    queryFn: () => analyticsAPI.getTrends(organizationId, days),
    enabled: !!user && !authLoading,
  });

  // Fetch resource breakdown
  const { data: breakdownData, isLoading: breakdownLoading } = useQuery({
    queryKey: ['analytics', 'breakdown', organizationId, days],
    queryFn: () => analyticsAPI.getBreakdown(organizationId, format(subDays(new Date(), days), 'yyyy-MM-dd'), format(new Date(), 'yyyy-MM-dd')),
    enabled: !!user && !authLoading,
  });

  // Fetch error analysis
  const { data: errorsData, isLoading: errorsLoading } = useQuery({
    queryKey: ['analytics', 'errors', organizationId, days],
    queryFn: () => analyticsAPI.getErrors(organizationId, format(subDays(new Date(), days), 'yyyy-MM-dd'), format(new Date(), 'yyyy-MM-dd')),
    enabled: !!user && !authLoading,
  });

  // Listen for real-time metric updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMetricUpdate = (metricData: any) => {
      console.log('Real-time metric update received:', metricData);
      
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['analytics', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'trends'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'errors'] });
    };

    socket.on('analytics:update', handleMetricUpdate);
    socket.on('metric:update', handleMetricUpdate);

    return () => {
      socket.off('analytics:update', handleMetricUpdate);
      socket.off('metric:update', handleMetricUpdate);
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
  const trends: UsageTrend[] = trendsData?.data?.trends || [];
  const breakdown: ResourceBreakdown | undefined = breakdownData?.data?.breakdown;
  const errors: ErrorAnalysis[] = errorsData?.data?.errors || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Monitor performance, usage, and costs
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={days.toString()} onValueChange={(value) => setDays(parseInt(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalExecutions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {overview.successfulExecutions} successful, {overview.failedExecutions} failed
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
                <p className="text-xs text-muted-foreground">
                  {overview.successfulExecutions} / {overview.totalExecutions} executions
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
                <p className="text-xs text-muted-foreground">
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
                <p className="text-xs text-muted-foreground">
                  Average execution time
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Usage Trends Chart */}
        {trends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Usage Trends</CardTitle>
              <CardDescription>Execution activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="agentsExecuted" stroke="#0088FE" name="Agents" />
                  <Line type="monotone" dataKey="workflowsExecuted" stroke="#00C49F" name="Workflows" />
                  <Line type="monotone" dataKey="pipelinesExecuted" stroke="#FFBB28" name="Pipelines" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resource Breakdown */}
          {breakdown && (
            <Card>
              <CardHeader>
                <CardTitle>Resource Breakdown</CardTitle>
                <CardDescription>Executions by resource type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Agents', value: breakdown.agents },
                        { name: 'Workflows', value: breakdown.workflows },
                        { name: 'Pipelines', value: breakdown.pipelines },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[breakdown.agents, breakdown.workflows, breakdown.pipelines].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Agents</span>
                    <span className="font-medium">{breakdown.agents}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Workflows</span>
                    <span className="font-medium">{breakdown.workflows}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pipelines</span>
                    <span className="font-medium">{breakdown.pipelines}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Analysis */}
          {errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Error Analysis</CardTitle>
                <CardDescription>Most common errors</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={errors}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="errorType" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Empty State */}
        {!overviewLoading && !overview && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No analytics data yet</h3>
                <p className="text-muted-foreground">
                  Analytics will appear here once you start executing agents, workflows, or pipelines
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;

