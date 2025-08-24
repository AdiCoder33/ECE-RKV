import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import loaderMp2 from '@/Assets/loader.mp4';

// Theme colors (matching UserManagement)
const THEME = {
  bgBeige: '#fbf4ea',
  accent: '#8b0000',
  accentHover: '#a52a2a',
  cardBg: 'bg-white',
  cardShadow: 'shadow-lg',
  textMuted: 'text-gray-600'
};

const PIE_COLORS = ['#2563eb', '#22c55e', '#a21caf', '#f59e42', '#e11d48', '#facc15'];

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
  const [enrollmentData, setEnrollmentData] = useState<{ year: string; students: number }[]>([]);
  const [recentActivities, setRecentActivities] = useState<{ id: number; action: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('token');

  // Loader component (same style as UserManagement)
  const EceVideoLoader: React.FC = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
      <video
        src={loaderMp2}
        autoPlay
        loop
        muted
        playsInline
        className="w-40 h-40 object-contain mb-4 rounded-lg shadow-lg"
        aria-label="Loading animation"
      />
      <div className="text-[#8b0000] font-semibold text-lg tracking-wide">Loading Dashboard...</div>
      <div className="text-[#a52a2a] text-sm mt-1">Fetching analytics, please wait</div>
    </div>
  );

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/analytics/overview`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats([
            {
              title: 'Total Students',
              value: String(data.totalUsers ?? 0),
              change: '+2%',
              icon: Users,
              color: 'text-blue-600',
              bgColor: 'bg-blue-50'
            },
            {
              title: 'Active Professors',
              value: String(data.totalProfessors ?? 0),
              change: '+1%',
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
              change: '+3%',
              icon: FileText,
              color: 'text-orange-600',
              bgColor: 'bg-orange-50'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch analytics overview', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [apiBase, token]);

  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        const res = await fetch(`${apiBase}/analytics/enrollment`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEnrollmentData(
            data.map((item: { year: any; students: number }) => ({
              year: String(item.year),
              students: item.students
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch enrollment analytics', error);
      }
    };
    fetchEnrollment();
  }, [apiBase, token]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch(`${apiBase}/analytics/activities`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRecentActivities(data);
        }
      } catch (error) {
        console.error('Failed to fetch activities', error);
      }
    };
    fetchActivities();
  }, [apiBase, token]);

  if (loading) {
    return (
      <div className="p-0 flex items-center justify-center min-h-screen" style={{ backgroundColor: THEME.bgBeige }}>
        <EceVideoLoader />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 sm:p-6"
      style={{ backgroundColor: THEME.bgBeige, paddingLeft: 12, paddingRight: 12 }}
    >
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold" style={{ color: THEME.accent }}>Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of <span className="font-semibold text-[#8b0000]">ECE Department</span> operations and management
        </p>
      </div>

      {/* Stats Grid - Move to Top */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} className={`${THEME.cardBg} ${THEME.cardShadow} border-0 rounded-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
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

      {/* Top Section: Year-wise Student Distribution & Academic Performance Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Year-wise Enrollment */}
        <Card className={`${THEME.cardBg} ${THEME.cardShadow} border-0 rounded-lg`}>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#2563eb] flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Year-wise Student Distribution
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Current student count across all years in ECE Department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" stroke="#2563eb" fontSize={13} />
                <YAxis stroke="#2563eb" fontSize={13} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1.5px solid #2563eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="students" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Academic Performance */}
        <Card className={`${THEME.cardBg} ${THEME.cardShadow} border-0 rounded-lg`}>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#22c55e] flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Academic Performance
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Overall department performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Average Attendance</span>
                <span className="font-medium text-[#2563eb]">87%</span>
              </div>
              <Progress value={87} className="h-2 bg-blue-100" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pass Rate</span>
                <span className="font-medium text-[#22c55e]">94%</span>
              </div>
              <Progress value={94} className="h-2 bg-green-100" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Placement Rate</span>
                <span className="font-medium text-[#f59e42]">78%</span>
              </div>
              <Progress value={78} className="h-2 bg-orange-100" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Research Publications</span>
                <span className="font-medium text-[#a21caf]">156</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Recent Activities */}
        <Card className={`${THEME.cardBg} ${THEME.cardShadow} border-0 rounded-lg lg:col-span-2`}>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#8b0000] flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Recent Activities
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Latest system activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-indigo-50">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className={`${THEME.cardBg} ${THEME.cardShadow} border-0 rounded-lg`}>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#2563eb] flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Quick Actions
            </CardTitle>
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
