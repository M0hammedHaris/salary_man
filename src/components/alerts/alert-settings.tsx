'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  CreditCard, 
  Bell, 
  Mail, 
  Smartphone,
  AlertTriangle,
  Save,
  RotateCcw
} from 'lucide-react';

interface AlertThreshold {
  id: string;
  accountId: string;
  accountName: string;
  thresholdType: 'percentage' | 'amount';
  thresholdValue: number;
  isEnabled: boolean;
}

interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  push: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily';
}

interface AlertSettingsProps {
  className?: string;
  onSave?: (settings: { thresholds: AlertThreshold[]; notifications: NotificationPreferences }) => void;
  onCancel?: () => void;
}

const DEFAULT_THRESHOLDS = [30, 50, 70, 90];

export function AlertSettings({ className, onSave, onCancel }: AlertSettingsProps) {
  const [loading, setLoading] = useState(false);
  
  // Mock data - replace with actual API calls
  const [accounts] = useState([
    { id: 'acc-1', name: 'HDFC Credit Card', type: 'credit_card', creditLimit: 100000 },
    { id: 'acc-2', name: 'SBI Credit Card', type: 'credit_card', creditLimit: 150000 },
    { id: 'acc-3', name: 'ICICI Credit Card', type: 'credit_card', creditLimit: 200000 },
  ]);

  const [thresholds, setThresholds] = useState<AlertThreshold[]>([
    {
      id: '1',
      accountId: 'acc-1',
      accountName: 'HDFC Credit Card',
      thresholdType: 'percentage',
      thresholdValue: 70,
      isEnabled: true,
    },
    {
      id: '2',
      accountId: 'acc-2',
      accountName: 'SBI Credit Card',
      thresholdType: 'percentage',
      thresholdValue: 80,
      isEnabled: true,
    },
  ]);

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    inApp: true,
    email: true,
    push: false,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
    frequency: 'immediate',
  });

  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [newThresholdType, setNewThresholdType] = useState<'percentage' | 'amount'>('percentage');
  const [newThresholdValue, setNewThresholdValue] = useState<string>('');

  const handleAddThreshold = () => {
    if (!selectedAccount || !newThresholdValue) return;

    const account = accounts.find(acc => acc.id === selectedAccount);
    if (!account) return;

    const value = parseFloat(newThresholdValue);
    if (isNaN(value) || value <= 0) return;

    // Validate percentage threshold
    if (newThresholdType === 'percentage' && (value < 1 || value > 100)) return;

    // Validate amount threshold
    if (newThresholdType === 'amount' && value > account.creditLimit) return;

    const newThreshold: AlertThreshold = {
      id: Date.now().toString(),
      accountId: selectedAccount,
      accountName: account.name,
      thresholdType: newThresholdType,
      thresholdValue: value,
      isEnabled: true,
    };

    setThresholds(prev => [...prev, newThreshold]);
    setSelectedAccount('');
    setNewThresholdValue('');
  };

  const handleRemoveThreshold = (thresholdId: string) => {
    setThresholds(prev => prev.filter(t => t.id !== thresholdId));
  };

  const handleToggleThreshold = (thresholdId: string) => {
    setThresholds(prev => prev.map(t => 
      t.id === thresholdId ? { ...t, isEnabled: !t.isEnabled } : t
    ));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Save settings via API
      const settings = {
        thresholds,
        notifications,
      };
      
      if (onSave) {
        await onSave(settings);
      }
      
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setThresholds([]);
    setNotifications({
      inApp: true,
      email: false,
      push: false,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
      frequency: 'immediate',
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Alert Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alert Thresholds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Thresholds */}
          <div className="space-y-3">
            {thresholds.map((threshold) => (
              <div 
                key={threshold.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm">{threshold.accountName}</p>
                    <p className="text-xs text-gray-600">
                      Alert when {threshold.thresholdType === 'percentage' 
                        ? `${threshold.thresholdValue}% utilization` 
                        : `₹${threshold.thresholdValue.toLocaleString('en-IN')} balance`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={threshold.isEnabled}
                    onCheckedChange={() => handleToggleThreshold(threshold.id)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveThreshold(threshold.id)}
                    className="h-8 w-8 p-0 hover:bg-red-100"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Threshold */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium mb-3 block">Add New Alert Threshold</Label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter(account => account.type === 'credit_card')
                    .map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={newThresholdType} onValueChange={(value: 'percentage' | 'amount') => setNewThresholdType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder={newThresholdType === 'percentage' ? '70' : '50000'}
                value={newThresholdValue}
                onChange={(e) => setNewThresholdValue(e.target.value)}
                min="1"
                max={newThresholdType === 'percentage' ? '100' : undefined}
              />

              <Button 
                onClick={handleAddThreshold}
                disabled={!selectedAccount || !newThresholdValue}
                className="w-full"
              >
                Add Threshold
              </Button>
            </div>
          </div>

          {/* Quick Add Common Thresholds */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium mb-2 block">Quick Add Common Thresholds</Label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_THRESHOLDS.map(percentage => (
                <Badge 
                  key={percentage}
                  variant="outline" 
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (selectedAccount) {
                      setNewThresholdType('percentage');
                      setNewThresholdValue(percentage.toString());
                    }
                  }}
                >
                  {percentage}%
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notification Channels */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Notification Channels</Label>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">In-app notifications</span>
                </div>
                <Switch
                  checked={notifications.inApp}
                  onCheckedChange={(checked: boolean) => 
                    setNotifications(prev => ({ ...prev, inApp: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">Email notifications</span>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked: boolean) => 
                    setNotifications(prev => ({ ...prev, email: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">Push notifications</span>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked: boolean) => 
                    setNotifications(prev => ({ ...prev, push: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Notification Frequency</Label>
            <Select 
              value={notifications.frequency} 
              onValueChange={(value: 'immediate' | 'hourly' | 'daily') =>
                setNotifications(prev => ({ ...prev, frequency: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="hourly">Hourly digest</SelectItem>
                <SelectItem value="daily">Daily digest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Quiet Hours</Label>
              <Switch
                checked={notifications.quietHours.enabled}
                onCheckedChange={(checked: boolean) => 
                  setNotifications(prev => ({ 
                    ...prev, 
                    quietHours: { ...prev.quietHours, enabled: checked }
                  }))
                }
              />
            </div>
            
            {notifications.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">From</Label>
                  <Input
                    type="time"
                    value={notifications.quietHours.startTime}
                    onChange={(e) => 
                      setNotifications(prev => ({ 
                        ...prev, 
                        quietHours: { ...prev.quietHours, startTime: e.target.value }
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">To</Label>
                  <Input
                    type="time"
                    value={notifications.quietHours.endTime}
                    onChange={(e) => 
                      setNotifications(prev => ({ 
                        ...prev, 
                        quietHours: { ...prev.quietHours, endTime: e.target.value }
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
        
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AlertSettings;
