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
  Clock,
  Play,
  Pause,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  schedulesAPI,
  type Schedule,
  type CreateScheduleData,
} from '@/lib/api/schedules';
import { toast } from '@/hooks/use-toast';

const Schedules = () => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateScheduleData>({
    name: '',
    resourceType: 'workflow',
    resourceId: '',
    cronExpression: '0 0 * * *', // Daily at midnight
    timezone: 'UTC',
    enabled: true,
  });

  // Fetch schedules
  const {
    data: schedulesData,
    isLoading: schedulesLoading,
    error: schedulesError,
  } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulesAPI.getSchedules(),
    enabled: !!user && !authLoading,
  });

  // Create schedule mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateScheduleData) => schedulesAPI.createSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setIsCreateDialogOpen(false);
      setCreateFormData({
        name: '',
        resourceType: 'workflow',
        resourceId: '',
        cronExpression: '0 0 * * *',
        timezone: 'UTC',
        enabled: true,
      });
      toast({
        title: 'Success',
        description: 'Schedule created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create schedule',
        variant: 'destructive',
      });
    },
  });

  // Delete schedule mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => schedulesAPI.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast({
        title: 'Success',
        description: 'Schedule deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete schedule',
        variant: 'destructive',
      });
    },
  });

  // Update schedule mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      schedulesAPI.updateSchedule(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast({
        title: 'Success',
        description: 'Schedule updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update schedule',
        variant: 'destructive',
      });
    },
  });

  const handleCreateSchedule = () => {
    if (!createFormData.name || !createFormData.resourceId || !createFormData.cronExpression) {
      toast({
        title: 'Validation Error',
        description: 'Name, resource ID, and cron expression are required',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(createFormData);
  };

  const handleDeleteSchedule = (id: string) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleSchedule = (schedule: Schedule) => {
    updateMutation.mutate({ id: schedule.id, enabled: !schedule.enabled });
  };

  const handleCopyCron = (cronExpression: string) => {
    navigator.clipboard.writeText(cronExpression);
    toast({
      title: 'Copied',
      description: 'Cron expression copied to clipboard',
    });
  };

  if (authLoading || schedulesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const schedules = schedulesData?.data?.schedules || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Schedules</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Schedule workflows and pipelines to run automatically
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Schedule
          </Button>
        </div>

        {/* Error State */}
        {schedulesError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Failed to load schedules. Please try again.</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!schedulesLoading && !schedulesError && schedules.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No schedules yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first schedule to automate workflows and pipelines
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedules List */}
        {!schedulesLoading && !schedulesError && schedules.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((schedule) => (
              <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{schedule.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {schedule.resourceType} • {schedule.resourceId.slice(0, 8)}...
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${
                        schedule.enabled ? 'bg-green-500' : 'bg-gray-500'
                      } text-white border-0`}
                    >
                      {schedule.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Cron Expression</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {schedule.cronExpression}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCron(schedule.cronExpression)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Timezone</span>
                      <span className="font-medium">{schedule.timezone}</span>
                    </div>
                    {schedule.nextRun && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Next Run</span>
                        <span className="font-medium">
                          {new Date(schedule.nextRun).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {schedule.lastRun && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Last Run</span>
                        <span className="font-medium">
                          {new Date(schedule.lastRun).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleSchedule(schedule)}
                        disabled={updateMutation.isPending}
                      >
                        {schedule.enabled ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Enable
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSchedule(schedule.id)}
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

        {/* Create Schedule Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Schedule</DialogTitle>
              <DialogDescription>
                Schedule a workflow or pipeline to run automatically
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Daily Report"
                  value={createFormData.name}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resourceType">Resource Type *</Label>
                <Select
                  value={createFormData.resourceType}
                  onValueChange={(value: 'workflow' | 'pipeline') =>
                    setCreateFormData({ ...createFormData, resourceType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workflow">Workflow</SelectItem>
                    <SelectItem value="pipeline">Pipeline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resourceId">Resource ID *</Label>
                <Input
                  id="resourceId"
                  placeholder="workflow-uuid or pipeline-uuid"
                  value={createFormData.resourceId}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, resourceId: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cronExpression">Cron Expression *</Label>
                <Input
                  id="cronExpression"
                  placeholder="0 0 * * *"
                  value={createFormData.cronExpression}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, cronExpression: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Format: minute hour day month weekday (e.g., "0 0 * * *" = daily at midnight)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  placeholder="UTC"
                  value={createFormData.timezone}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, timezone: e.target.value })
                  }
                />
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
              <Button onClick={handleCreateSchedule} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Schedule'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Schedules;

