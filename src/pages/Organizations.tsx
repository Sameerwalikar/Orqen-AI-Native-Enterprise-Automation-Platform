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
  Building2,
  Users,
  Settings,
  UserPlus,
  Crown,
  Shield,
  User,
  Eye,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  organizationsAPI,
  type Organization,
  type OrganizationMember,
  type CreateOrganizationData,
} from '@/lib/api/organizations';
import { toast } from '@/hooks/use-toast';

const Organizations = () => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateOrganizationData>({
    name: '',
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN' | 'VIEWER'>('MEMBER');
  const [isResourcesDialogOpen, setIsResourcesDialogOpen] = useState(false);
  const [resourcesData, setResourcesData] = useState<any>(null);

  // Fetch organizations
  const {
    data: orgsData,
    isLoading: orgsLoading,
    error: orgsError,
  } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationsAPI.getOrganizations(),
    enabled: !!user && !authLoading,
  });

  // Fetch members for selected org
  const {
    data: membersData,
    isLoading: membersLoading,
  } = useQuery({
    queryKey: ['organizations', selectedOrg?.id, 'members'],
    queryFn: () => organizationsAPI.getMembers(selectedOrg!.id),
    enabled: !!selectedOrg && isMembersDialogOpen,
  });

  // Fetch resources for selected org
  const {
    data: resourcesResponse,
    isLoading: resourcesLoading,
  } = useQuery({
    queryKey: ['organizations', selectedOrg?.id, 'resources'],
    queryFn: () => organizationsAPI.getResources(selectedOrg!.id),
    enabled: !!selectedOrg && isResourcesDialogOpen,
  });

  // Create organization mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateOrganizationData) => organizationsAPI.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setIsCreateDialogOpen(false);
      setCreateFormData({ name: '' });
      toast({
        title: 'Success',
        description: 'Organization created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create organization',
        variant: 'destructive',
      });
    },
  });

  // Delete organization mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => organizationsAPI.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: 'Success',
        description: 'Organization deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete organization',
        variant: 'destructive',
      });
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: ({ orgId, email, role }: { orgId: string; email: string; role: string }) =>
      organizationsAPI.addMember(orgId, { userEmail: email, role: role as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', selectedOrg?.id, 'members'] });
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      toast({
        title: 'Success',
        description: 'Member invited successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add member',
        variant: 'destructive',
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({ orgId, userId }: { orgId: string; userId: number }) =>
      organizationsAPI.removeMember(orgId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', selectedOrg?.id, 'members'] });
      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member',
        variant: 'destructive',
      });
    },
  });

  const handleCreateOrganization = () => {
    if (!createFormData.name) {
      toast({
        title: 'Validation Error',
        description: 'Organization name is required',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(createFormData);
  };

  const handleDeleteOrganization = (id: string) => {
    if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleInviteMember = () => {
    if (!inviteEmail || !selectedOrg) return;
    addMemberMutation.mutate({ orgId: selectedOrg.id, email: inviteEmail, role: inviteRole });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'MEMBER':
        return <User className="h-4 w-4 text-green-500" />;
      case 'VIEWER':
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  if (authLoading || orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const organizations: Organization[] = orgsData?.data?.organizations || [];
  const members: OrganizationMember[] = membersData?.data?.members || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Organizations</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your organizations and teams
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </div>

        {/* Error State */}
        {orgsError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Failed to load organizations. Please try again.</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!orgsLoading && !orgsError && organizations.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create an organization to collaborate with your team
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Organization
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Organizations List */}
        {!orgsLoading && !orgsError && organizations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {org.slug}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{org.plan}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Your Role</span>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(org.role || 'MEMBER')}
                        <span className="font-medium">{org.role || 'MEMBER'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrg(org);
                          setIsMembersDialogOpen(true);
                        }}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Members
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrg(org);
                          setIsResourcesDialogOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Resources
                      </Button>
                      {(org.role === 'OWNER' || org.role === 'ADMIN') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrg(org);
                            setIsInviteDialogOpen(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Invite
                        </Button>
                      )}
                      {org.role === 'OWNER' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOrganization(org.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Organization Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Create a new organization to collaborate with your team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  placeholder="My Organization"
                  value={createFormData.name}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, name: e.target.value })
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
              <Button onClick={handleCreateOrganization} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Members Dialog */}
        <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Members - {selectedOrg?.name}</DialogTitle>
              <DialogDescription>
                Manage organization members and their roles
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {membersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No members yet</p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {member.user.avatarUrl ? (
                            <img
                              src={member.user.avatarUrl}
                              alt={member.user.firstName}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <span className="text-primary font-semibold">
                              {member.user.firstName[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{member.user.firstName}</p>
                          <p className="text-sm text-muted-foreground">{member.user.gmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          <span className="text-sm">{member.role}</span>
                        </div>
                        {selectedOrg?.role === 'OWNER' &&
                          member.role !== 'OWNER' &&
                          member.userId !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (window.confirm('Remove this member?')) {
                                  removeMemberMutation.mutate({
                                    orgId: selectedOrg.id,
                                    userId: member.userId,
                                  });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMembersDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invite Member Dialog */}
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Member</DialogTitle>
              <DialogDescription>
                Invite a user to join {selectedOrg?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsInviteDialogOpen(false)}
                disabled={addMemberMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleInviteMember} disabled={addMemberMutation.isPending || !inviteEmail}>
                {addMemberMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  'Invite'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Organizations;

