
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  MapPin,
  Play
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const ProfessorDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectMap, setSubjectMap] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const [totalStudents, setTotalStudents] = useState(0);
  const [activeClasses, setActiveClasses] = useState(0);
  const [avgAttendance, setAvgAttendance] = useState(0);
  const [pendingGrading, setPendingGrading] = useState(0);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const [classData, setClassData] = useState([]);

  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [gradingDistribution, setGradingDistribution] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);

  // Demo today's schedule
  const demoSchedule = [
    {
      id: 1,
      day: 'Monday',
      time: '09:00-10:00',
      subject: 'Data Structures',
      room: 'CS-101',
      year: 3,
      section: 'A',
      current: true
    },
    {
      id: 2,
      day: 'Monday',
      time: '11:00-12:00',
      subject: 'Database Systems',
      room: 'CS-102',
      year: 3,
      section: 'B',
      current: false
    },
    {
      id: 3,
      day: 'Monday',
      time: '14:00-15:00',
      subject: 'Operating Systems',
      room: 'CS-103',
      year: 4,
      section: 'A',
      current: false
    }
  ];

  useEffect(() => {
    if (typeof user?.id !== 'number') {
      toast({ variant: 'destructive', title: 'Invalid user ID' });
      return;
    }

    fetchTodaySchedule();
    fetchSubjects();
    fetchProfessorMetrics();
    fetchClassData();
    fetchAttendanceTrend();
    fetchGradingDistribution();
    fetchActivityFeed();
  }, [user]);

  const fetchClassData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (typeof user?.id !== 'number') {
        toast({ variant: 'destructive', title: 'Invalid user ID' });
        return;
      }
      const response = await fetch(`${apiBase}/professors/${String(user.id)}/classes`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setClassData(data);
      } else {
        setClassData([]);
      }
    } catch (error) {
      console.error('Error fetching class data:', error);
      setClassData([]);
    }
  };

  const fetchProfessorMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (typeof user?.id !== 'number') {
        toast({ variant: 'destructive', title: 'Invalid user ID' });
        return;
      }
      const response = await fetch(`${apiBase}/professors/${String(user.id)}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTotalStudents(data.totalStudents ?? 0);
        setActiveClasses(data.activeClasses ?? 0);
        setAvgAttendance(data.avgAttendance ?? 0);
        setPendingGrading(data.pendingGrading ?? 0);
      } else {
        setMetricsError(true);
      }
    } catch (error) {
      console.error('Error fetching professor metrics:', error);
      setMetricsError(true);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchAttendanceTrend = async () => {
    try {
      const token = localStorage.getItem('token');
      if (typeof user?.id !== 'number') {
        toast({ variant: 'destructive', title: 'Invalid user ID' });
        return;
      }
      const response = await fetch(`${apiBase}/professors/${String(user.id)}/attendance-trend?weeks=5`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAttendanceTrend(data);
      } else {
        setAttendanceTrend([]);
      }
    } catch (error) {
      console.error('Error fetching attendance trend:', error);
      setAttendanceTrend([]);
    }
  };

  const fetchGradingDistribution = async () => {
    try {
      const token = localStorage.getItem('token');
      if (typeof user?.id !== 'number') {
        toast({ variant: 'destructive', title: 'Invalid user ID' });
        return;
      }
      const response = await fetch(`${apiBase}/professors/${String(user.id)}/grading-distribution`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setGradingDistribution(data);
      } else {
        setGradingDistribution([]);
      }
    } catch (error) {
      console.error('Error fetching grading distribution:', error);
      setGradingDistribution([]);
    }
  };

  const fetchActivityFeed = async () => {
    try {
      const token = localStorage.getItem('token');
      if (typeof user?.id !== 'number') {
        toast({ variant: 'destructive', title: 'Invalid user ID' });
        return;
      }
      const response = await fetch(`${apiBase}/professors/${String(user.id)}/activity-feed`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setActivityFeed(data);
      } else {
        setActivityFeed([]);
      }
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      setActivityFeed([]);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      
      if (typeof user?.id !== 'number') {
        toast({ variant: 'destructive', title: 'Invalid user ID' });
        setTodaySchedule(demoSchedule);
        return;
      }
      const response = await fetch(
        `${apiBase}/timetable?facultyId=${String(user.id)}&day=${today}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const schedule = await response.json();
        setTodaySchedule(schedule);
      } else {
        // Use demo data if API fails
        setTodaySchedule(demoSchedule);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      // Use demo data on error
      setTodaySchedule(demoSchedule);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/subjects`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const map: Record<string, string> = data.reduce(
          (acc: Record<string, string>, subj: { id: string; name: string }) => {
            acc[subj.name] = subj.id;
            return acc;
          },
          {}
        );
        setSubjectMap(map);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  };

  const isCurrentClass = (timeSlot) => {
    const currentTime = getCurrentTime();
    const [startTime] = timeSlot.split('-');
    return currentTime >= startTime && currentTime <= timeSlot.split('-')[1];
  };

  const handleClassClick = (classItem) => {
    const subjectId = subjectMap[classItem.subject] || classItem.subject;
    navigate(
      `/dashboard/attendance?time=${encodeURIComponent(
        classItem.time
      )}&subjectId=${subjectId}&year=${classItem.year}&section=${classItem.section}`
    );
  };

  const formatActivityTime = (time: string) =>
    formatDistanceToNow(new Date(time), { addSuffix: true });

  if (authLoading || !user?.id) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 px-4 py-4 sm:px-6 md:px-6 lg:px-8">
      {/* Header */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.profileImage} alt={user?.name} />
              <AvatarFallback>{user?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                Good morning, {user?.name}
              </h1>
              <p className="text-sm lg:text-base text-muted-foreground mt-1 lg:mt-2">
                Manage your classes and track student performance
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
            <Button variant="outline" size="sm" className="text-xs lg:text-sm">
              <FileText className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
              Export Report
            </Button>
            <Button size="sm" className="text-xs lg:text-sm">
              <TrendingUp className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
              Analytics
            </Button>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-white">Total Students</CardTitle>
            <Users className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold text-white">
              {metricsLoading ? '...' : metricsError ? 'N/A' : totalStudents}
            </div>
            <p className="text-xs text-indigo-100">
              {metricsLoading ? '...' : metricsError ? 'N/A' : `Across ${activeClasses} classes`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metricsLoading ? '...' : metricsError ? 'N/A' : activeClasses}
            </div>
            <p className="text-xs text-emerald-100">
              {metricsLoading || metricsError ? '' : 'This semester'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Avg Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="text-2xl font-bold text-white">...</div>
            ) : metricsError ? (
              <div className="text-2xl font-bold text-white">N/A</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{avgAttendance}%</div>
                <Progress value={avgAttendance} className="mt-2 bg-white/20" />
                <p className="text-xs text-white mt-1">
                  <span className={avgAttendance >= 80 ? 'text-green-200' : 'text-yellow-200'}>
                    {avgAttendance >= 80 ? 'Good' : 'Needs attention'}
                  </span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Pending Grading</CardTitle>
            <Clock className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metricsLoading ? '...' : metricsError ? 'N/A' : pendingGrading}
            </div>
            <p className="text-xs text-yellow-100">
              {metricsLoading || metricsError ? '' : 'Assignments to grade'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Class Performance */}
        <Card className="border-border bg-gradient-to-r from-blue-50 to-indigo-100">
          <CardHeader>
            <CardTitle className="text-foreground">Class Performance</CardTitle>
            <CardDescription className="text-muted-foreground">
              Average scores and attendance by class
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={classData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="avgScore" fill="#8B0000" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No class data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Trend */}
        <Card className="border-border bg-gradient-to-r from-purple-50 to-pink-100">
          <CardHeader>
            <CardTitle className="text-foreground">Attendance Trend</CardTitle>
            <CardDescription className="text-muted-foreground">
              Weekly attendance across all classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[70, 100]} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="attendance" 
                  stroke="#001F54" 
                  strokeWidth={3}
                  dot={{ fill: '#001F54', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2 border-border bg-gradient-to-r from-slate-50 to-gray-100">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Your classes for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : todaySchedule.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No classes scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((classItem) => {
                  const isCurrent = isCurrentClass(classItem.time);
                  return (
                    <div 
                      key={classItem.id} 
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        isCurrent 
                          ? 'bg-primary/10 border-primary shadow-sm' 
                          : 'bg-muted/30 border-border hover:bg-muted/50'
                      }`}
                      onClick={() => handleClassClick(classItem)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-foreground">{classItem.subject}</h4>
                            {isCurrent && (
                              <Badge variant="default" className="bg-green-600 text-white">
                                <Play className="h-3 w-3 mr-1" />
                                Live
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {classItem.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {classItem.room}
                            </span>
                            <Badge variant="outline">
                              {classItem.year}-{classItem.section}
                            </Badge>
                          </div>
                        </div>
                        <Button 
                          variant={isCurrent ? "default" : "outline"} 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClassClick(classItem);
                          }}
                        >
                          {isCurrent ? "Mark Attendance" : "View Class"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border bg-gradient-to-r from-teal-50 to-emerald-100">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Common teaching tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 lg:space-y-3">
            <Button 
              className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground text-xs lg:text-sm h-8 lg:h-10" 
              variant="default"
              onClick={() => navigate('/dashboard/attendance')}
            >
              <Calendar className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
              Mark Attendance
            </Button>
            <Button 
              className="w-full justify-start text-xs lg:text-sm h-8 lg:h-10" 
              variant="outline"
              onClick={() => navigate('/dashboard/marks-upload')}
            >
              <FileText className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
              Upload Marks
            </Button>
            <Button className="w-full justify-start text-xs lg:text-sm h-8 lg:h-10" variant="outline">
              <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
              Performance Reports
            </Button>
            <Button className="w-full justify-start text-xs lg:text-sm h-8 lg:h-10" variant="outline">
              <BookOpen className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
              Course Materials
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="border-border bg-gradient-to-r from-gray-50 to-gray-100">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Activities</CardTitle>
          <CardDescription className="text-muted-foreground">
            Latest updates from your classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activityFeed.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 lg:gap-4 p-2 lg:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="w-2 h-2 bg-primary rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.details}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatActivityTime(activity.time)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Class Details */}
      <Card className="border-border bg-gradient-to-r from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle className="text-foreground">Class Overview</CardTitle>
          <CardDescription className="text-muted-foreground">
            Detailed information about your classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {classData.map((classItem, index) => (
                <div key={index} className="p-3 lg:p-4 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground">{classItem.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {classItem.students} students
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Score:</span>
                      <span className="font-medium text-foreground">{classItem.avgScore}%</span>
                    </div>
                    <Progress value={classItem.avgScore} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Attendance:</span>
                      <span className={`font-medium ${classItem.attendance >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {classItem.attendance}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">No classes found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessorDashboard;
