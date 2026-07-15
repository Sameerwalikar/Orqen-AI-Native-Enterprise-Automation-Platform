import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { authAPI } from '@/lib/api/auth';
import { 
  User as UserIcon, 
  Mail, 
  Bell, 
  Shield, 
  Globe,
  Save,
  Key,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cookieService } from '@/lib/utils/cookies';
import { useAuth } from '@/contexts/AuthContext';

const Settings = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, isLoading: authLoading, checkSession } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
  });

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
    weeklyDigest: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        email: user.gmail,
      });
      setMounted(true);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.firstName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'First name is required.',
      });
      return;
    }

    if (formData.firstName.trim().length < 2) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'First name must be at least 2 characters long.',
      });
      return;
    }

    if (formData.firstName.trim().length > 50) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'First name must be less than 50 characters.',
      });
      return;
    }

    // Check if name actually changed
    if (formData.firstName.trim() === user?.firstName) {
      toast({
        title: 'No changes',
        description: 'No changes were made to your profile.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await authAPI.updateProfile({
        firstName: formData.firstName.trim()
      });

      // Refresh session to update user data
      if (response.data?.user) {
        await checkSession();
      }

      toast({
        title: 'Profile updated',
        description: response.message || 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Update profile error:', error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8" style={{ zoom: 0.85 }}>
        {/* Header Section */}
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Settings */}
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Profile Information</CardTitle>
                <CardDescription className="text-sm">Update your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter your first name"
                className="max-w-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative max-w-md">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="pl-10"
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="mt-4">
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
                <CardDescription className="text-sm">Manage how you receive notifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-base font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for important updates
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={() => handleSettingToggle('emailNotifications')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-emails" className="text-base font-medium">
                  Marketing Emails
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive emails about new features and promotions
                </p>
              </div>
              <Switch
                id="marketing-emails"
                checked={settings.marketingEmails}
                onCheckedChange={() => handleSettingToggle('marketingEmails')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="security-alerts" className="text-base font-medium">
                  Security Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about security-related activities
                </p>
              </div>
              <Switch
                id="security-alerts"
                checked={settings.securityAlerts}
                onCheckedChange={() => handleSettingToggle('securityAlerts')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-digest" className="text-base font-medium">
                  Weekly Digest
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly summary of your activity
                </p>
              </div>
              <Switch
                id="weekly-digest"
                checked={settings.weeklyDigest}
                onCheckedChange={() => handleSettingToggle('weeklyDigest')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Security</CardTitle>
                <CardDescription className="text-sm">Manage your security settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted-foreground">Last updated 30 days ago</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Preferences</CardTitle>
                <CardDescription className="text-sm">Customize your experience</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color theme
                </p>
              </div>
              {mounted ? (
                <RadioGroup
                  value={theme || 'system'}
                  onValueChange={(value) => {
                    setTheme(value);
                    if (cookieService.hasConsent()) {
                      cookieService.setTheme(value as 'light' | 'dark' | 'system');
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="light" id="theme-light" className="mt-0.5" />
                    <Label
                      htmlFor="theme-light"
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <Sun className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Light</p>
                        <p className="text-xs text-muted-foreground">Use light theme</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="dark" id="theme-dark" className="mt-0.5" />
                    <Label
                      htmlFor="theme-dark"
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <Moon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Dark</p>
                        <p className="text-xs text-muted-foreground">Use dark theme</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="system" id="theme-system" className="mt-0.5" />
                    <Label
                      htmlFor="theme-system"
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">System</p>
                        <p className="text-xs text-muted-foreground">Match your system preference</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              ) : (
                <div className="space-y-3">
                  <div className="h-16 rounded-lg bg-muted/30 animate-pulse" />
                  <div className="h-16 rounded-lg bg-muted/30 animate-pulse" />
                  <div className="h-16 rounded-lg bg-muted/30 animate-pulse" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;

