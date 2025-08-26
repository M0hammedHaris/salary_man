'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Monitor, 
  Settings,
  Shield,
  Check,
  AlertCircle
} from 'lucide-react';
import { useNotifications } from './notification-provider';

export function NotificationSettings() {
  const {
    preferences,
    updatePreferences,
    requestPushPermission,
    isPushSupported,
    isPushPermissionGranted,
  } = useNotifications();

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled && !isPushPermissionGranted) {
      const granted = await requestPushPermission();
      if (granted) {
        await updatePreferences({ push: true });
      }
    } else {
      await updatePreferences({ push: enabled });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Notification Settings</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose how you want to receive credit card usage alerts
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* In-App Notifications */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Monitor className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <Label htmlFor="in-app" className="text-sm font-medium">
                In-App Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Show toast notifications while using the app
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              <Check className="h-3 w-3 mr-1" />
              Always Available
            </Badge>
            <Switch
              id="in-app"
              checked={preferences.inApp}
              onCheckedChange={(checked) => updatePreferences({ inApp: checked })}
            />
          </div>
        </div>

        {/* Email Notifications */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Mail className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive alerts via email for important updates
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              <Shield className="h-3 w-3 mr-1" />
              Secure
            </Badge>
            <Switch
              id="email"
              checked={preferences.email}
              onCheckedChange={(checked) => updatePreferences({ email: checked })}
            />
          </div>
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Smartphone className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <Label htmlFor="push" className="text-sm font-medium">
                Browser Push Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Get notified even when the app is closed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPushSupported ? (
              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                Not Supported
              </Badge>
            ) : isPushPermissionGranted ? (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <Check className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Permission Required
              </Badge>
            )}
            <Switch
              id="push"
              checked={preferences.push && isPushPermissionGranted}
              onCheckedChange={handlePushToggle}
              disabled={!isPushSupported}
            />
          </div>
        </div>

        {/* Push Permission Info */}
        {isPushSupported && !isPushPermissionGranted && preferences.push && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800 mb-1">
                  Permission Required
                </h4>
                <p className="text-xs text-yellow-700 mb-3">
                  To receive push notifications, you need to grant permission in your browser.
                </p>
                <Button
                  size="sm"
                  onClick={requestPushPermission}
                  className="h-7 text-xs"
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Grant Permission
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" />
            <span>
              You will receive notifications via:{' '}
              {[
                preferences.inApp && 'In-App',
                preferences.email && 'Email',
                preferences.push && isPushPermissionGranted && 'Push',
              ]
                .filter(Boolean)
                .join(', ') || 'No channels selected'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default NotificationSettings;
