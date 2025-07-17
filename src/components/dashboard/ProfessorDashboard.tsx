
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ProfessorDashboard = () => {
  const { user } = useAuth();
  
  const classes = [
    { 
      name: 'Data Structures - CSE 3A', 
      students: 45, 
      avgAttendance: 85, 
      pendingMarks: 12,
      nextClass: '2024-01-10 10:00 AM'
    },
    { 
      name: 'Algorithms - CSE 3B', 
      students: 42, 
      avgAttendance: 92, 
      pendingMarks: 0,
      nextClass: '2024-01-10 2:00 PM'
    },
    { 
      name: 'Database Systems - CSE 4A', 
      students: 38, 
      avgAttendance: 78, 
      pendingMarks: 8,
      nextClass: '2024-01-11 9:00 AM'
    },
  ];

  const recentActivities = [
    { action: 'Attendance marked for Data Structures', time: '2 hours ago', type: 'attendance' },
    { action: 'Internal marks uploaded for CSE 3B', time: '5 hours ago', type: 'marks' },
    { action: 'Assignment created for Database Systems', time: '1 day ago', type: 'assignment' },
    { action: 'Class rescheduled due to holiday', time: '2 days ago', type: 'schedule' },
  ];

  const todaySchedule = [
    { subject: 'Data Structures', class: 'CSE 3A', time: '10:00 AM - 11:00 AM', room: 'Lab 1' },
    { subject: 'Algorithms', class: 'CSE 3B', time: '2:00 PM - 3:00 PM', room: 'Room 205' },
    { subject: 'Office Hours', class: 'All Classes', time: '4:00 PM - 5:00 PM', room: 'Office 12' },
  ];

  const totalStudents = classes.reduce((acc, cls) => acc + cls.students, 0);
  const avgAttendance = Math.round(classes.reduce((acc, cls) => acc + cls.avgAttendance, 0) / classes.length);
  const totalPendingMarks = classes.reduce((acc, cls) => acc + cls.pendingMarks, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.name}!</h1>
          <p className="text-muted-foreground">Department of {user?.department}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Marks
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Attendance</p>
                <p className="text-2xl font-bold">{avgAttendance}%</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Classes Today</p>
                <p className="text-2xl font-bold">{todaySchedule.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Marks</p>
                <p className="text-2xl font-bold">{totalPendingMarks}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your classes and activities for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaySchedule.map((schedule, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{schedule.subject}</p>
                  <p className="text-sm text-muted-foreground">{schedule.class} • {schedule.room}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{schedule.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Class Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Class Overview</CardTitle>
            <CardDescription>Performance summary of your classes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {classes.map((cls, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">{cls.students} students</p>
                  </div>
                  <div className="flex gap-2">
                    {cls.pendingMarks > 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        {cls.pendingMarks} pending
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Up to date
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Average Attendance</span>
                    <span>{cls.avgAttendance}%</span>
                  </div>
                  <Progress value={cls.avgAttendance} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Next class: {cls.nextClass}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Your latest actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Alert */}
      {totalPendingMarks > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">Pending Tasks</p>
                <p className="text-sm text-orange-700">
                  You have {totalPendingMarks} internal marks pending upload across your classes.
                </p>
              </div>
              <Button size="sm" variant="outline" className="border-orange-300 text-orange-700">
                Upload Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfessorDashboard;
