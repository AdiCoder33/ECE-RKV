
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Award,
  Clock,
  Target,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  
  const subjects = [
    { name: 'Data Structures', code: 'CS301', attendance: 85, internals: 78, professor: 'Dr. Smith' },
    { name: 'Database Management', code: 'CS302', attendance: 92, internals: 85, professor: 'Prof. Johnson' },
    { name: 'Web Development', code: 'CS303', attendance: 78, internals: 82, professor: 'Dr. Wilson' },
    { name: 'Software Engineering', code: 'CS304', attendance: 88, internals: 90, professor: 'Prof. Brown' },
    { name: 'Computer Networks', code: 'CS305', attendance: 95, internals: 88, professor: 'Dr. Davis' },
  ];

  const upcomingEvents = [
    { title: 'Mid-term Exam - Data Structures', date: '2024-01-15', type: 'exam' },
    { title: 'Assignment Due - Web Development', date: '2024-01-12', type: 'assignment' },
    { title: 'Lab Session - Database Management', date: '2024-01-10', type: 'lab' },
    { title: 'Project Presentation', date: '2024-01-18', type: 'presentation' },
  ];

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 85) return 'Good';
    if (percentage >= 75) return 'Warning';
    return 'Critical';
  };

  const overallStats = {
    attendance: Math.round(subjects.reduce((acc, sub) => acc + sub.attendance, 0) / subjects.length),
    internals: Math.round(subjects.reduce((acc, sub) => acc + sub.internals, 0) / subjects.length),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">
            Year {user?.year} • Section {user?.section} • Roll No: {user?.rollNumber}
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Current Semester
        </Badge>
      </div>

      {/* Overall Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Attendance</p>
                <p className={`text-2xl font-bold ${getAttendanceColor(overallStats.attendance)}`}>
                  {overallStats.attendance}%
                </p>
                <Badge 
                  variant={overallStats.attendance >= 85 ? 'default' : overallStats.attendance >= 75 ? 'secondary' : 'destructive'}
                  className="text-xs mt-1"
                >
                  {getAttendanceStatus(overallStats.attendance)}
                </Badge>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Internal Average</p>
                <p className="text-2xl font-bold text-green-600">{overallStats.internals}%</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Above Average
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Academic Standing</p>
                <p className="text-2xl font-bold text-blue-600">Good</p>
                <p className="text-xs text-muted-foreground">Rank: 15/89</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Attendance and internal marks overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {subjects.map((subject, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{subject.name}</p>
                    <p className="text-sm text-muted-foreground">{subject.code} • {subject.professor}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={subject.attendance >= 85 ? 'default' : subject.attendance >= 75 ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {subject.attendance}% Attendance
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Attendance</span>
                    <span className={getAttendanceColor(subject.attendance)}>{subject.attendance}%</span>
                  </div>
                  <Progress value={subject.attendance} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span>Internal Marks</span>
                    <span className="text-green-600">{subject.internals}%</span>
                  </div>
                  <Progress value={subject.internals} className="h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Exams, assignments, and important dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="flex-shrink-0">
                  {event.type === 'exam' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                  {event.type === 'assignment' && <BookOpen className="h-5 w-5 text-blue-600" />}
                  {event.type === 'lab' && <Clock className="h-5 w-5 text-green-600" />}
                  {event.type === 'presentation' && <Award className="h-5 w-5 text-purple-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.date}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {event.type}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Alert */}
      {overallStats.attendance < 85 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Attendance Warning</p>
                <p className="text-sm text-yellow-700">
                  Your overall attendance is {overallStats.attendance}%. Maintain at least 85% to avoid academic issues.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentDashboard;
