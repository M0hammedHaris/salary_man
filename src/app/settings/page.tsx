import { Metadata } from 'next';
import { Settings, Bell, Lock, Shield, User, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
    title: 'Settings - SalaryMan',
    description: 'Manage your application settings and preferences'
};

export default function SettingsPage() {
    return (
        <div className="container mx-auto py-8 max-w-5xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account settings and set e-mail preferences.
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
                            <CardDescription>Update your photo and personal details here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input id="name" defaultValue="Mohammed Haris" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" defaultValue="haris@example.com" disabled />
                                <p className="text-xs text-muted-foreground">Please contact support to change your email.</p>
                            </div>
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
                                    <p className="text-sm text-muted-foreground">Permanently remove your account and all financial data.</p>
                                </div>
                                <Button variant="destructive">Delete Account</Button>
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
                                    <p className="text-sm text-muted-foreground">Switch between light and dark themes.</p>
                                </div>
                                <Switch id="theme-mode" />
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <Label>Accent Color</Label>
                                <div className="flex flex-wrap gap-3">
                                    <button className="w-10 h-10 rounded-full bg-blue-500 ring-2 ring-offset-2 ring-blue-500"></button>
                                    <button className="w-10 h-10 rounded-full bg-violet-500"></button>
                                    <button className="w-10 h-10 rounded-full bg-emerald-500"></button>
                                    <button className="w-10 h-10 rounded-full bg-amber-500"></button>
                                    <button className="w-10 h-10 rounded-full bg-rose-500"></button>
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
                                    <span className="font-normal text-sm text-muted-foreground">Receive alerts when bills are due soon.</span>
                                </Label>
                                <Switch id="bills" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="savings" className="flex flex-col space-y-1">
                                    <span>Savings Milestones</span>
                                    <span className="font-normal text-sm text-muted-foreground">Get achievements when you hit goals.</span>
                                </Label>
                                <Switch id="savings" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="spending" className="flex flex-col space-y-1">
                                    <span>Spending Alerts</span>
                                    <span className="font-normal text-sm text-muted-foreground">Notify when you exceed budget categories.</span>
                                </Label>
                                <Switch id="spending" defaultChecked />
                            </div>
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
                                    <span>Biometric Auth</span>
                                    <span className="font-normal text-sm text-muted-foreground">Use FaceID/TouchID to access sensitive data.</span>
                                </Label>
                                <Switch id="biometric" />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="data-sharing" className="flex flex-col space-y-1">
                                    <span>Data Sharing</span>
                                    <span className="font-normal text-sm text-muted-foreground">Share anonymized data to help improve features.</span>
                                </Label>
                                <Switch id="data-sharing" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
