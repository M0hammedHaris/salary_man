'use client';

import { useState, useEffect } from 'react';
import { Settings, Bell, Mail, Smartphone, MessageSquare, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QuietHoursSettings } from './quiet-hours-settings';
import { NotificationTest } from './notification-test';

interface NotificationPreferencesPanelProps {
  userId: string;
}

interface AlertTypePreference {
  alertType: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  smsEnabled: boolean;
  frequencyLimit: number | null;
}

interface GlobalPreferences {
  timezone: string;
  emergencyOverride: boolean;
  batchNotifications: boolean;
  digestFrequency: 'none' | 'daily' | 'weekly';
}

const ALERT_TYPES = [
  { 
    value: 'low_balance', 
    label: 'Low Balance Alerts',
    description: 'When account balance falls below threshold',
    critical: true
  },
  { 
    value: 'bill_due', 
    label: 'Bill Due Reminders',
    description: 'Upcoming bill payment notifications',
    critical: false
  },
  { 
    value: 'transaction_alert', 
    label: 'Transaction Alerts',
    description: 'Real-time transaction notifications',
    critical: true
  },
  { 
    value: 'payment_confirmation', 
    label: 'Payment Confirmations',
    description: 'Successful payment notifications',
    critical: false
  },
  { 
    value: 'fraud_alert', 
    label: 'Fraud Alerts',
    description: 'Suspicious activity warnings',
    critical: true
  },
  { 
    value: 'budget_exceeded', 
    label: 'Budget Alerts',
    description: 'When spending exceeds budget limits',
    critical: false
  },
  { 
    value: 'recurring_payment', 
    label: 'Recurring Payments',
    description: 'Automatic payment notifications',
    critical: false
  }
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'UTC', label: 'UTC' },
];

export function NotificationPreferencesPanel({ userId }: NotificationPreferencesPanelProps) {
  const [alertPreferences, setAlertPreferences] = useState<AlertTypePreference[]>([]);
  const [globalPreferences, setGlobalPreferences] = useState<GlobalPreferences>({
    timezone: 'UTC',
    emergencyOverride: true,
    batchNotifications: false,
    digestFrequency: 'none'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        
        // Initialize preferences for all alert types
        const preferences = ALERT_TYPES.map(alertType => {
          const existing = data.preferences?.find((p: AlertTypePreference) => p.alertType === alertType.value);
          return {
            alertType: alertType.value,
            emailEnabled: existing?.emailEnabled ?? true,
            pushEnabled: existing?.pushEnabled ?? true,
            inAppEnabled: existing?.inAppEnabled ?? true,
            smsEnabled: existing?.smsEnabled ?? false,
            frequencyLimit: existing?.frequencyLimit ?? null
          };
        });
        
        setAlertPreferences(preferences);
        setGlobalPreferences(prev => ({
          ...prev,
          timezone: data.timezone || 'UTC',
          emergencyOverride: data.emergencyOverride ?? true
        }));
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAlertPreference = (alertType: string, field: keyof AlertTypePreference, value: boolean | number | null) => {
    setAlertPreferences(prev => 
      prev.map(pref => 
        pref.alertType === alertType 
          ? { ...pref, [field]: value }
          : pref
      )
    );
  };

  const updateGlobalPreference = (field: keyof GlobalPreferences, value: string | boolean) => {
    setGlobalPreferences(prev => ({ ...prev, [field]: value }));
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: alertPreferences,
          ...globalPreferences
        }),
      });

      if (response.ok) {
        setSaveMessage('Preferences saved successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setSaveMessage('Failed to save preferences. Please try again.');
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const enableAllChannels = (alertType: string) => {
    updateAlertPreference(alertType, 'emailEnabled', true);
    updateAlertPreference(alertType, 'pushEnabled', true);
    updateAlertPreference(alertType, 'inAppEnabled', true);
  };

  const disableAllChannels = (alertType: string) => {
    updateAlertPreference(alertType, 'emailEnabled', false);
    updateAlertPreference(alertType, 'pushEnabled', false);
    updateAlertPreference(alertType, 'inAppEnabled', false);
    updateAlertPreference(alertType, 'smsEnabled', false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading preferences...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Alert Types</TabsTrigger>
          <TabsTrigger value="quiet-hours">Quiet Hours</TabsTrigger>
          <TabsTrigger value="global">Global Settings</TabsTrigger>
          <TabsTrigger value="test">Test Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Preferences by Alert Type
              </CardTitle>
              <CardDescription>
                Configure delivery channels for each type of financial alert
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {ALERT_TYPES.map(alertType => {
                const preference = alertPreferences.find(p => p.alertType === alertType.value);
                if (!preference) return null;

                return (
                  <div key={alertType.value} className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-medium">
                            {alertType.label}
                          </Label>
                          {alertType.critical && (
                            <Badge variant="destructive" className="text-xs">
                              Critical
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alertType.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => enableAllChannels(alertType.value)}
                        >
                          Enable All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disableAllChannels(alertType.value)}
                        >
                          Disable All
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`${alertType.value}-inapp`}
                          checked={preference.inAppEnabled}
                          onCheckedChange={(checked) => 
                            updateAlertPreference(alertType.value, 'inAppEnabled', checked)
                          }
                        />
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          <Label htmlFor={`${alertType.value}-inapp`}>In-App</Label>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`${alertType.value}-email`}
                          checked={preference.emailEnabled}
                          onCheckedChange={(checked) => 
                            updateAlertPreference(alertType.value, 'emailEnabled', checked)
                          }
                        />
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <Label htmlFor={`${alertType.value}-email`}>Email</Label>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`${alertType.value}-push`}
                          checked={preference.pushEnabled}
                          onCheckedChange={(checked) => 
                            updateAlertPreference(alertType.value, 'pushEnabled', checked)
                          }
                        />
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          <Label htmlFor={`${alertType.value}-push`}>Push</Label>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`${alertType.value}-sms`}
                          checked={preference.smsEnabled}
                          onCheckedChange={(checked) => 
                            updateAlertPreference(alertType.value, 'smsEnabled', checked)
                          }
                        />
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <Label htmlFor={`${alertType.value}-sms`}>SMS</Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Label htmlFor={`${alertType.value}-frequency`} className="text-sm">
                        Daily Limit:
                      </Label>
                      <Input
                        id={`${alertType.value}-frequency`}
                        type="number"
                        min="1"
                        max="100"
                        placeholder="No limit"
                        value={preference.frequencyLimit || ''}
                        onChange={(e) => 
                          updateAlertPreference(
                            alertType.value, 
                            'frequencyLimit', 
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        notifications per day (0 = no limit)
                      </span>
                    </div>

                    {alertType.critical && (
                      <Alert>
                        <AlertDescription>
                          Critical alerts may override quiet hours and delivery limits for security purposes.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Separator />
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-4">
                <div>
                  {saveMessage && (
                    <p className={`text-sm ${
                      saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {saveMessage}
                    </p>
                  )}
                </div>
                <Button onClick={savePreferences} disabled={saving}>
                  {saving ? (
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiet-hours">
          <QuietHoursSettings userId={userId} />
        </TabsContent>

        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>
                Configure system-wide notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="timezone">Default Timezone</Label>
                <Select 
                  value={globalPreferences.timezone} 
                  onValueChange={(value) => updateGlobalPreference('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="emergencyOverride">Emergency Override</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow critical alerts during quiet hours
                  </p>
                </div>
                <Switch
                  id="emergencyOverride"
                  checked={globalPreferences.emergencyOverride}
                  onCheckedChange={(checked) => 
                    updateGlobalPreference('emergencyOverride', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="batchNotifications">Batch Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Group similar notifications together
                  </p>
                </div>
                <Switch
                  id="batchNotifications"
                  checked={globalPreferences.batchNotifications}
                  onCheckedChange={(checked) => 
                    updateGlobalPreference('batchNotifications', checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="digestFrequency">Notification Digest</Label>
                <Select 
                  value={globalPreferences.digestFrequency} 
                  onValueChange={(value) => updateGlobalPreference('digestFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Disabled</SelectItem>
                    <SelectItem value="daily">Daily Summary</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={savePreferences} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Global Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <NotificationTest userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
