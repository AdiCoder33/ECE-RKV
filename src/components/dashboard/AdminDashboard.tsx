
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  TrendingUp,
  Plus,
  Upload,
  BarChart3,
  Calendar
} from 'lucide-react';

const AdminDashboard = () => {
  const stats = [
    { title: 'Total Students', value: '2,847', change: '+12%', icon: Users, color: 'text-blue-600' },
    { title: 'Active Professors', value: '156', change: '+3%', icon: GraduationCap, color: 'text-green-600' },
    { title: 'Subjects', value: '342', change: '+8%', icon: BookOpen, color: 'text-purple-600' },
    { title: 'Classes', value: '89', change: '+5%', icon: Calendar, color: 'text-orange-600' },
  ];

  const recentActivities = [
    { action: 'New student batch uploaded', time: '2 hours ago', type: 'upload' },
    { action: 'Semester promotion completed for CSE 2nd year', time: '5 hours ago', type: 'promotion' },
    { action: 'New professor assigned to Data Structures', time: '1 day ago', type: 'assignment' },
    { action: 'Mid-term results published', time: '2 days ago', type: 'results' },
  ];

  const quickActions = [
    { title: 'Add New User', icon: Plus, description: 'Create student, professor, or staff account' },
    { title: 'Upload Students', icon: Upload, description: 'Bulk upload students via Excel' },
    { title: 'Manage Classes', icon: BookOpen, description: 'Create or modify class sections' },
    { title: 'View Analytics', icon: BarChart3, description: 'Performance and attendance reports' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage and monitor the entire academic system</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Quick Setup
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickActions.map((action, index) => (
              <Button 
                key={index}
                variant="ghost" 
                className="w-full justify-start h-auto p-4 text-left"
              >
                <action.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest system updates and changes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {activity.type}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Current semester status and health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">85%</div>
              <p className="text-sm text-muted-foreground">Average Attendance</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">92%</div>
              <p className="text-sm text-muted-foreground">Assignment Completion</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">78%</div>
              <p className="text-sm text-muted-foreground">Internal Marks Uploaded</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
