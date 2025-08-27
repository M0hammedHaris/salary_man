'use client';

import { useState, useEffect } from 'react';
import { Clock, Moon, Sun, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface QuietHoursSettingsProps {
  userId: string;
  onSettingsChange?: (settings: QuietHoursConfig) => void;
}

interface QuietHoursConfig {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
  emergencyOverride: boolean;
  weekdaysOnly: boolean;
  customSchedule: {
    [key: string]: { enabled: boolean; startTime: string; endTime: string };
  };
}

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

const WEEKDAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export function QuietHoursSettings({ userId, onSettingsChange }: QuietHoursSettingsProps) {
  const [config, setConfig] = useState<QuietHoursConfig>({
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    emergencyOverride: true,
    weekdaysOnly: false,
    customSchedule: {}
  });
  const [loading, setLoading] = useState(true);
  const [showCustomSchedule, setShowCustomSchedule] = useState(false);

  useEffect(() => {
    loadQuietHoursConfig();
  }, [userId]);

  const loadQuietHoursConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/quiet-hours');
      if (response.ok) {
        const data = await response.json();
        setConfig(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to load quiet hours configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (updates: Partial<QuietHoursConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onSettingsChange?.(newConfig);
  };

  const updateCustomSchedule = (day: string, schedule: { enabled: boolean; startTime: string; endTime: string }) => {
    const newCustomSchedule = {
      ...config.customSchedule,
      [day]: schedule
    };
    updateConfig({ customSchedule: newCustomSchedule });
  };

  const calculateQuietHoursDuration = () => {
    const start = new Date(`1970-01-01T${config.startTime}:00`);
    const end = new Date(`1970-01-01T${config.endTime}:00`);
    
    let duration: number;
    if (end > start) {
      duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    } else {
      // Overnight period
      duration = (24 - start.getHours() + end.getHours()) + (end.getMinutes() - start.getMinutes()) / 60;
    }
    
    return Math.round(duration * 10) / 10; // Round to 1 decimal place
  };

  const getQuietHoursPreview = () => {
    const now = new Date();
    const startTime = new Date(`${now.toDateString()} ${config.startTime}`);
    const endTime = new Date(`${now.toDateString()} ${config.endTime}`);
    
    if (endTime < startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }

    return {
      start: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: calculateQuietHoursDuration()
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const preview = getQuietHoursPreview();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quiet Hours Configuration
          </CardTitle>
          <CardDescription>
            Set times when you don&apos;t want to receive non-critical notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="quietHoursEnabled">Enable Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">
                Suppress non-critical notifications during specified times
              </p>
            </div>
            <Switch
              id="quietHoursEnabled"
              checked={config.enabled}
              onCheckedChange={(enabled) => updateConfig({ enabled })}
            />
          </div>

          {config.enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Start Time
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={config.startTime}
                    onChange={(e) => updateConfig({ startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    End Time
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={config.endTime}
                    onChange={(e) => updateConfig({ endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={config.timezone} onValueChange={(timezone) => updateConfig({ timezone })}>
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

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Preview</Badge>
                  <span className="text-sm font-medium">
                    {preview.start} - {preview.end} ({preview.duration}h)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Quiet hours will be active from {preview.start} to {preview.end} in {config.timezone}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emergencyOverride">Emergency Override</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow critical financial alerts during quiet hours
                    </p>
                  </div>
                  <Switch
                    id="emergencyOverride"
                    checked={config.emergencyOverride}
                    onCheckedChange={(emergencyOverride) => updateConfig({ emergencyOverride })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weekdaysOnly">Weekdays Only</Label>
                    <p className="text-sm text-muted-foreground">
                      Apply quiet hours only on weekdays (Mon-Fri)
                    </p>
                  </div>
                  <Switch
                    id="weekdaysOnly"
                    checked={config.weekdaysOnly}
                    onCheckedChange={(weekdaysOnly) => updateConfig({ weekdaysOnly })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="customSchedule">Custom Schedule</Label>
                    <p className="text-sm text-muted-foreground">
                      Set different quiet hours for each day of the week
                    </p>
                  </div>
                  <Switch
                    id="customSchedule"
                    checked={showCustomSchedule}
                    onCheckedChange={setShowCustomSchedule}
                  />
                </div>
              </div>

              {showCustomSchedule && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Weekly Schedule</CardTitle>
                    <CardDescription>
                      Configure different quiet hours for each day
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {WEEKDAYS.map(day => {
                      const dayConfig = config.customSchedule[day.key] || {
                        enabled: false,
                        startTime: config.startTime,
                        endTime: config.endTime
                      };

                      return (
                        <div key={day.key} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="w-20">
                            <Label className="font-medium">{day.label}</Label>
                          </div>
                          <Switch
                            checked={dayConfig.enabled}
                            onCheckedChange={(enabled) => 
                              updateCustomSchedule(day.key, { ...dayConfig, enabled })
                            }
                          />
                          {dayConfig.enabled && (
                            <>
                              <Input
                                type="time"
                                value={dayConfig.startTime}
                                onChange={(e) => 
                                  updateCustomSchedule(day.key, { ...dayConfig, startTime: e.target.value })
                                }
                                className="w-24"
                              />
                              <span className="text-muted-foreground">to</span>
                              <Input
                                type="time"
                                value={dayConfig.endTime}
                                onChange={(e) => 
                                  updateCustomSchedule(day.key, { ...dayConfig, endTime: e.target.value })
                                }
                                className="w-24"
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {config.emergencyOverride && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Critical financial alerts (like fraud detection, overdrafts, or payment failures) 
                    will still be delivered during quiet hours for your financial security.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
