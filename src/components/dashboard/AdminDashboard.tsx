
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  TrendingUp,
  UserPlus,
  FileText,
  BarChart3,
  Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stat {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${apiBase}/analytics/overview`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats([
            {
              title: 'Total Students',
              value: String(data.totalUsers ?? 0),
              change: '0%',
              icon: Users,
              color: 'text-blue-600',
              bgColor: 'bg-blue-50'
            },
            {
              title: 'Active Professors',
              value: String(data.totalProfessors ?? 0),
              change: '0%',
              icon: GraduationCap,
              color: 'text-green-600',
              bgColor: 'bg-green-50'
            },
            {
              title: 'Active Classes',
              value: String(data.totalClasses ?? 0),
              change: '0%',
              icon: BookOpen,
              color: 'text-purple-600',
              bgColor: 'bg-purple-50'
            },
            {
              title: 'Courses',
              value: String(data.totalSubjects ?? 0),
              change: '0%',
              icon: FileText,
              color: 'text-orange-600',
              bgColor: 'bg-orange-50'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch analytics overview', error);
      }
    };
    fetchStats();
  }, [apiBase, token]);

  const enrollmentData = [
    { year: '1st Year', students: 800 },
    { year: '2nd Year', students: 750 },
    { year: '3rd Year', students: 720 },
    { year: '4th Year', students: 577 }
  ];

  const recentActivities = [
    {
      id: 1,
      action: 'New student enrollment',
      user: 'John Smith',
      time: '2 minutes ago',
      type: 'enrollment'
    },
    {
      id: 2,
      action: 'Professor assignment updated',
      user: 'Dr. Emily Davis',
      time: '15 minutes ago',
      type: 'assignment'
    },
    {
      id: 3,
      action: 'Course material uploaded',
      user: 'Prof. Michael Johnson',
      time: '1 hour ago',
      type: 'upload'
    },
    {
      id: 4,
      action: 'Attendance report generated',
      user: 'System',
      time: '2 hours ago',
      type: 'system'
    }
  ];

  return (
    <div className="space-y-6 px-4 sm:px-6 md:px-0">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of ECE Department operations and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>
                {' '}from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Year-wise Enrollment */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Year-wise Student Distribution</CardTitle>
            <CardDescription className="text-muted-foreground">
              Current student count across all years in ECE Department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Academic Performance Overview */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Academic Performance</CardTitle>
            <CardDescription className="text-muted-foreground">
              Overall department performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Average Attendance</span>
                <span className="font-medium">87%</span>
              </div>
              <Progress value={87} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pass Rate</span>
                <span className="font-medium">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Placement Rate</span>
                <span className="font-medium">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Research Publications</span>
                <span className="font-medium">156</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activities</CardTitle>
            <CardDescription className="text-muted-foreground">
              Latest system activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">by {activity.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" onClick={() => window.location.href = '/dashboard/users'}>
              <UserPlus className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/dashboard/groups'}>
              <GraduationCap className="h-4 w-4 mr-2" />
              Chat Groups
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/dashboard/timetable'}>
              <BookOpen className="h-4 w-4 mr-2" />
              Timetable
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Reports
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Attendance Management
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
