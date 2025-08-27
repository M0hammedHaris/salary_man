'use client';

import { useState } from 'react';
import { Send, Bell, Mail, Smartphone, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface NotificationTestProps {
  userId: string;
}

interface TestNotification {
  type: string;
  channel: 'in-app' | 'email' | 'push';
  message?: string;
}

interface TestResult {
  success: boolean;
  channel: string;
  message: string;
  timestamp: Date;
  details?: string;
}

const NOTIFICATION_TYPES = [
  { value: 'low_balance', label: 'Low Balance Alert', icon: AlertCircle },
  { value: 'bill_due', label: 'Bill Due Reminder', icon: Bell },
  { value: 'transaction_alert', label: 'Transaction Alert', icon: Smartphone },
  { value: 'payment_confirmation', label: 'Payment Confirmation', icon: CheckCircle2 },
  { value: 'fraud_alert', label: 'Fraud Alert (Critical)', icon: XCircle },
  { value: 'budget_exceeded', label: 'Budget Exceeded', icon: AlertCircle },
  { value: 'recurring_payment', label: 'Recurring Payment', icon: Bell },
];

const DELIVERY_CHANNELS = [
  { value: 'in-app', label: 'In-App Notification', icon: Bell },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'push', label: 'Push Notification', icon: Smartphone },
];

export function NotificationTest({ userId: _userId }: NotificationTestProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const sendTestNotification = async () => {
    if (!selectedType || !selectedChannel) return;

    setIsLoading(true);
    try {
      const testNotification: TestNotification = {
        type: selectedType,
        channel: selectedChannel as 'in-app' | 'email' | 'push',
        message: customMessage || undefined
      };

      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testNotification),
      });

      const result = await response.json();
      
      const testResult: TestResult = {
        success: response.ok,
        channel: selectedChannel,
        message: result.message || (response.ok ? 'Test notification sent successfully' : 'Failed to send test notification'),
        timestamp: new Date(),
        details: result.details
      };

      setTestResults(prev => [testResult, ...prev.slice(0, 9)]); // Keep last 10 results
    } catch (error) {
      const testResult: TestResult = {
        success: false,
        channel: selectedChannel,
        message: 'Network error occurred',
        timestamp: new Date(),
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      setTestResults(prev => [testResult, ...prev.slice(0, 9)]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestToAllChannels = async () => {
    if (!selectedType) return;

    setIsLoading(true);
    const channels = ['in-app', 'email', 'push'] as const;
    
    for (const channel of channels) {
      try {
        const testNotification: TestNotification = {
          type: selectedType,
          channel,
          message: customMessage || undefined
        };

        const response = await fetch('/api/notifications/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testNotification),
        });

        const result = await response.json();
        
        const testResult: TestResult = {
          success: response.ok,
          channel,
          message: result.message || (response.ok ? 'Test notification sent successfully' : 'Failed to send test notification'),
          timestamp: new Date(),
          details: result.details
        };

        setTestResults(prev => [testResult, ...prev.slice(0, 9)]);
        
        // Small delay between channels
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        const testResult: TestResult = {
          success: false,
          channel,
          message: 'Network error occurred',
          timestamp: new Date(),
          details: error instanceof Error ? error.message : 'Unknown error'
        };
        setTestResults(prev => [testResult, ...prev.slice(0, 9)]);
      }
    }
    
    setIsLoading(false);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const getChannelIcon = (channel: string) => {
    const channelConfig = DELIVERY_CHANNELS.find(c => c.value === channel);
    return channelConfig?.icon || Bell;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Test Notifications
          </CardTitle>
          <CardDescription>
            Send test notifications to verify your delivery preferences and troubleshoot issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notificationType">Notification Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryChannel">Delivery Channel</Label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery channel" />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_CHANNELS.map(channel => {
                    const Icon = channel.icon;
                    return (
                      <SelectItem key={channel.value} value={channel.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {channel.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customMessage">Custom Message (Optional)</Label>
            <Textarea
              id="customMessage"
              placeholder="Enter a custom test message or leave blank for default message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={sendTestNotification}
              disabled={!selectedType || !selectedChannel || isLoading}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Sending...' : 'Send Test'}
            </Button>
            
            <Button
              variant="outline"
              onClick={sendTestToAllChannels}
              disabled={!selectedType || isLoading}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Test All Channels
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Test notifications will respect your current quiet hours and preference settings. 
              Critical alerts may override quiet hours as configured.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Test Results</CardTitle>
              <Button variant="outline" size="sm" onClick={clearTestResults}>
                Clear Results
              </Button>
            </div>
            <CardDescription>
              Recent test notification delivery results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {testResults.map((result, index) => {
              const ChannelIcon = getChannelIcon(result.channel);
              return (
                <div
                  key={index}
                  className={`p-3 border rounded-lg ${
                    result.success ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <ChannelIcon className="h-4 w-4" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={result.success ? 'default' : 'destructive'}>
                            {result.channel}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {result.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{result.message}</p>
                        {result.details && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {result.details}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      {result.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
