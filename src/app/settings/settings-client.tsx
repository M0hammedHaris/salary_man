'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Bell, Lock, User, Monitor, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface NotificationSettings {
  billReminders: boolean;
  savingsMilestones: boolean;
  spendingAlerts: boolean;
  creditUtilization: boolean;
  lowBalance: boolean;
}

interface PrivacySettings {
  biometricAuth: boolean;
  dataSharing: boolean;
}

const ACCENT_COLORS = [
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Violet', value: 'violet', class: 'bg-violet-500' },
  { name: 'Emerald', value: 'emerald', class: 'bg-emerald-500' },
  { name: 'Amber', value: 'amber', class: 'bg-amber-500' },
  { name: 'Rose', value: 'rose', class: 'bg-rose-500' },
];

export function SettingsClient() {
  const { user, isLoaded } = useUser();
  const { theme, setTheme } = useTheme();
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    billReminders: true,
    savingsMilestones: true,
    spendingAlerts: true,
    creditUtilization: true,
    lowBalance: true,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    biometricAuth: false,
    dataSharing: false,
  });
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  
  const [selectedAccentColor, setSelectedAccentColor] = useState('blue');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      setDisplayName(user.fullName || '');
      setEmail(user.primaryEmailAddress?.emailAddress || '');
      
      // Load user preferences from metadata
      const metadata = user.unsafeMetadata as Record<string, unknown>;
      if (metadata.accentColor) {
        setSelectedAccentColor(metadata.accentColor as string);
      }
      if (metadata.notificationSettings) {
        setNotificationSettings(metadata.notificationSettings as NotificationSettings);
      }
      if (metadata.privacySettings) {
        setPrivacySettings(metadata.privacySettings as PrivacySettings);
      }
    }
  }, [isLoaded, user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSavingProfile(true);
    try {
      await user.update({
        firstName: displayName.split(' ')[0] || displayName,
        lastName: displayName.split(' ').slice(1).join(' ') || '',
      });
      
      toast.success('Profile updated', {
        description: 'Your profile information has been saved successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error', {
        description: 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  const handleAccentColorChange = async (color: string) => {
    if (!user) return;
    
    setSelectedAccentColor(color);
    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          accentColor: color,
        },
      });
      
      // Apply accent color to document root
      document.documentElement.style.setProperty('--accent-color', color);
      
      toast.success('Accent color updated', {
        description: `Theme color changed to ${color}.`,
      });
    } catch (error) {
      console.error('Error updating accent color:', error);
      toast.error('Error', {
        description: 'Failed to update accent color.',
      });
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    
    setIsSavingNotifications(true);
    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          notificationSettings,
        },
      });
      
      toast.success('Notification preferences saved', {
        description: 'Your notification settings have been updated.',
      });
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Error', {
        description: 'Failed to update notification preferences.',
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!user) return;
    
    setIsSavingPrivacy(true);
    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          privacySettings,
        },
      });
      
      toast.success('Privacy settings saved', {
        description: 'Your privacy preferences have been updated.',
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Error', {
        description: 'Failed to update privacy settings.',
      });
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      // Call API to delete user data
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      
      // Delete Clerk user
      await user.delete();
      
      toast.success('Account deleted', {
        description: 'Your account and all data have been permanently deleted.',
      });
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Error', {
        description: 'Failed to delete account. Please contact support.',
      });
    }
  };

  if (!isLoaded || !mounted) {
    return (
      <div className="container mx-auto py-8 max-w-5xl flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1">
          <TabsTrigger value="account" className="py-3 gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="appearance" className="py-3 gap-2">
            <Monitor className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="py-3 gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="py-3 gap-2">
            <Lock className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} disabled />
                <p className="text-xs text-muted-foreground">
                  Email is managed by your authentication provider.
                </p>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently remove your account and all financial data.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your financial data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Preferences</CardTitle>
              <CardDescription>Customize how the app looks on your device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="theme-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes.
                  </p>
                </div>
                <Switch
                  id="theme-mode"
                  checked={theme === 'dark'}
                  onCheckedChange={handleThemeToggle}
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <Label>Accent Color</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred accent color for the interface.
                </p>
                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleAccentColorChange(color.value)}
                      className={`w-10 h-10 rounded-full ${color.class} transition-all ${
                        selectedAccentColor === color.value
                          ? 'ring-2 ring-offset-2 ring-offset-background ring-current scale-110'
                          : 'hover:scale-105'
                      }`}
                      aria-label={`Select ${color.name} accent color`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what you want to be notified about.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="bills" className="flex flex-col space-y-1">
                  <span>Bill Reminders</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Receive alerts when bills are due soon.
                  </span>
                </Label>
                <Switch
                  id="bills"
                  checked={notificationSettings.billReminders}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, billReminders: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="savings" className="flex flex-col space-y-1">
                  <span>Savings Milestones</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Get notifications when you hit savings goals.
                  </span>
                </Label>
                <Switch
                  id="savings"
                  checked={notificationSettings.savingsMilestones}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, savingsMilestones: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="spending" className="flex flex-col space-y-1">
                  <span>Spending Alerts</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Notify when you exceed budget categories.
                  </span>
                </Label>
                <Switch
                  id="spending"
                  checked={notificationSettings.spendingAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, spendingAlerts: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="credit" className="flex flex-col space-y-1">
                  <span>Credit Utilization Alerts</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Get notified about credit card utilization thresholds.
                  </span>
                </Label>
                <Switch
                  id="credit"
                  checked={notificationSettings.creditUtilization}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, creditUtilization: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="balance" className="flex flex-col space-y-1">
                  <span>Low Balance Warnings</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Alert when account balance falls below threshold.
                  </span>
                </Label>
                <Switch
                  id="balance"
                  checked={notificationSettings.lowBalance}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, lowBalance: checked })
                  }
                />
              </div>
              <Separator />
              <Button onClick={handleSaveNotifications} disabled={isSavingNotifications}>
                {isSavingNotifications ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Security</CardTitle>
              <CardDescription>Manage your data visibility and security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="biometric" className="flex flex-col space-y-1">
                  <span>Biometric Authentication</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Use FaceID/TouchID to access sensitive data (browser support required).
                  </span>
                </Label>
                <Switch
                  id="biometric"
                  checked={privacySettings.biometricAuth}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({ ...privacySettings, biometricAuth: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="data-sharing" className="flex flex-col space-y-1">
                  <span>Anonymous Usage Data</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Share anonymized usage data to help improve features.
                  </span>
                </Label>
                <Switch
                  id="data-sharing"
                  checked={privacySettings.dataSharing}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({ ...privacySettings, dataSharing: checked })
                  }
                />
              </div>
              <Separator />
              <Button onClick={handleSavePrivacy} disabled={isSavingPrivacy}>
                {isSavingPrivacy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
