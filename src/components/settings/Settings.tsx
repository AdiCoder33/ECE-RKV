
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotifyToggle from '@/components/NotifyToggle';
import { 
  Settings as SettingsIcon, 
  Bell,
  Shield,
  Database,
  Download,
  Upload,
  Trash2,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';

const Settings = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    announcementAlerts: true,
    attendanceReminders: true,
    gradeUpdates: true
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    loginAlerts: true
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleSecurityChange = (key: string, value: boolean | string) => {
    setSecurity(prev => ({ ...prev, [key]: value }));
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const text = await res.text();
      let data: { error?: string } | null = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // ignore JSON parse errors
      }

      console.log('Password update response', { status: res.status, data });

      if (!res.ok) {
        toast.error(data?.error || `Failed to update password (status ${res.status})`);
        return;
      }
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 md:px-0">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and system settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data & Privacy</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic application preferences and display options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Theme Preference</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Language</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Time Zone</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option value="IST">India Standard Time (IST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Date Format</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(value) => handleNotificationChange('emailNotifications', value)}
                  />
                </div>

                <NotifyToggle />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Announcement Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified about new announcements</p>
                  </div>
                  <Switch
                    checked={notifications.announcementAlerts}
                    onCheckedChange={(value) => handleNotificationChange('announcementAlerts', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Attendance Reminders</p>
                    <p className="text-sm text-muted-foreground">Reminders for low attendance</p>
                  </div>
                  <Switch
                    checked={notifications.attendanceReminders}
                    onCheckedChange={(value) => handleNotificationChange('attendanceReminders', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Grade Updates</p>
                    <p className="text-sm text-muted-foreground">Notifications when grades are updated</p>
                  </div>
                  <Switch
                    checked={notifications.gradeUpdates}
                    onCheckedChange={(value) => handleNotificationChange('gradeUpdates', value)}
                  />
                </div>
              </div>

              <Button>
                <Bell className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Change Password</label>
                  <div className="space-y-3 mt-2">
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch
                    checked={security.twoFactorAuth}
                    onCheckedChange={(value) => handleSecurityChange('twoFactorAuth', value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Session Timeout (minutes)</label>
                  <Input
                    type="number"
                    value={security.sessionTimeout}
                    onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Login Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified of login attempts</p>
                  </div>
                  <Switch
                    checked={security.loginAlerts}
                    onCheckedChange={(value) => handleSecurityChange('loginAlerts', value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button>
                  <Shield className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
                <Button variant="outline" onClick={handlePasswordUpdate}>
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
              <CardDescription>Manage your data and privacy preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Export Your Data</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Download a copy of your academic records, attendance, and other data
                  </p>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Import Data</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Import your data from previous academic systems
                  </p>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                </div>

                <div className="p-4 border rounded-lg border-red-200">
                  <h4 className="font-medium mb-2 text-red-600">Delete Account</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Permanently delete your account and all associated data
                  </p>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>System administration and maintenance options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Database Backup</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create a backup of the system database
                  </p>
                  <Button variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">System Maintenance</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Perform system cleanup and optimization
                  </p>
                  <Button variant="outline">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Run Maintenance
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">System Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span>1.2.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span>January 15, 2024</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Database Size:</span>
                      <span>245 MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Users:</span>
                      <span>1,247</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
