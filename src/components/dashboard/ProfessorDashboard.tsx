
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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

const ProfessorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const totalStudents = 156;
  const activeClasses = 4;
  const avgAttendance = 84;
  const pendingGrading = 23;

  const classData = [
    { name: 'CSE-3A', students: 45, avgScore: 78, attendance: 88, color: '#8B0000' },
    { name: 'CSE-3B', students: 42, avgScore: 82, attendance: 85, color: '#001F54' },
    { name: 'CSE-4A', students: 38, avgScore: 85, attendance: 90, color: '#8B5E3C' },
    { name: 'CSE-4B', students: 31, avgScore: 80, attendance: 82, color: '#4A5568' }
  ];

  const attendanceTrend = [
    { week: 'Week 1', attendance: 88 },
    { week: 'Week 2', attendance: 85 },
    { week: 'Week 3', attendance: 82 },
    { week: 'Week 4', attendance: 87 },
    { week: 'Week 5', attendance: 84 }
  ];

  const gradingDistribution = [
    { grade: 'A+', count: 25, color: '#22c55e' },
    { grade: 'A', count: 38, color: '#3b82f6' },
    { grade: 'B+', count: 42, color: '#f59e0b' },
    { grade: 'B', count: 31, color: '#ef4444' },
    { grade: 'C+', count: 20, color: '#8b5cf6' }
  ];

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
    fetchTodaySchedule();
  }, []);

  const fetchTodaySchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      
      const response = await fetch(`http://localhost:5000/api/timetable?faculty=${user?.name}&day=${today}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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
    navigate(`/dashboard/attendance?year=${classItem.year}&section=${classItem.section}&subject=${classItem.subject}`);
  };

  const recentActivities = [
    {
      id: 1,
      action: 'Assignment submitted',
      details: 'Data Structures - CSE-3A',
      time: '5 minutes ago',
      type: 'submission'
    },
    {
      id: 2,
      action: 'Low attendance alert',
      details: 'John Doe - 65% attendance',
      time: '1 hour ago',
      type: 'alert'
    },
    {
      id: 3,
      action: 'Grades updated',
      details: 'Database Systems - CSE-3B',
      time: '2 hours ago',
      type: 'grading'
    },
    {
      id: 4,
      action: 'Class scheduled',
      details: 'Operating Systems - Tomorrow 10:00 AM',
      time: '3 hours ago',
      type: 'schedule'
    }
  ];

  return (
    <div className="space-y-4 lg:space-y-6 px-4 py-4 sm:px-6 lg:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Professor Dashboard</h1>
          <p className="text-sm lg:text-base text-muted-foreground mt-1 lg:mt-2">Manage your classes and track student performance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="h-3 w-3 lg:h-4 lg:w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold text-foreground">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Across {activeClasses} classes
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeClasses}</div>
            <p className="text-xs text-muted-foreground">
              This semester
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{avgAttendance}%</div>
            <Progress value={avgAttendance} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <span className={avgAttendance >= 80 ? 'text-green-600' : 'text-yellow-600'}>
                {avgAttendance >= 80 ? 'Good' : 'Needs attention'}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Grading</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingGrading}</div>
            <p className="text-xs text-muted-foreground">
              Assignments to grade
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Class Performance */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Class Performance</CardTitle>
            <CardDescription className="text-muted-foreground">
              Average scores and attendance by class
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Attendance Trend */}
        <Card className="border-border">
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
        <Card className="lg:col-span-2 border-border">
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
        <Card className="border-border">
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
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Activities</CardTitle>
          <CardDescription className="text-muted-foreground">
            Latest updates from your classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 lg:gap-4 p-2 lg:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.details}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Class Details */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Class Overview</CardTitle>
          <CardDescription className="text-muted-foreground">
            Detailed information about your classes
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessorDashboard;
