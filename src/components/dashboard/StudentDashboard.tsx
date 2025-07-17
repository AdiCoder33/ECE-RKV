
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Award,
  Clock,
  Target,
  FileText,
  CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const StudentDashboard = () => {
  const currentGPA = 8.4;
  const attendancePercentage = 87;
  const completedCredits = 142;
  const totalCredits = 180;

  const subjectPerformance = [
    { subject: 'Data Structures', marks: 92, attendance: 95, color: '#8B0000' },
    { subject: 'Database Systems', marks: 88, attendance: 82, color: '#001F54' },
    { subject: 'Operating Systems', marks: 85, attendance: 89, color: '#8B5E3C' },
    { subject: 'Computer Networks', marks: 90, attendance: 91, color: '#4A5568' },
    { subject: 'Software Engineering', marks: 87, attendance: 85, color: '#2D5A27' }
  ];

  const monthlyAttendance = [
    { month: 'Aug', attendance: 92 },
    { month: 'Sep', attendance: 88 },
    { month: 'Oct', attendance: 85 },
    { month: 'Nov', attendance: 89 },
    { month: 'Dec', attendance: 87 }
  ];

  const upcomingAssignments = [
    {
      id: 1,
      subject: 'Data Structures',
      title: 'Binary Tree Implementation',
      dueDate: '2024-01-15',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 2,
      subject: 'Database Systems',
      title: 'SQL Query Optimization',
      dueDate: '2024-01-18',
      status: 'in-progress',
      priority: 'medium'
    },
    {
      id: 3,
      subject: 'Software Engineering',
      title: 'Project Documentation',
      dueDate: '2024-01-20',
      status: 'pending',
      priority: 'low'
    }
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600 text-white';
      case 'in-progress': return 'bg-blue-600 text-white';
      case 'pending': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
        <p className="text-muted-foreground mt-2">Track your academic progress and performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current GPA</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{currentGPA}</div>
            <Progress value={(currentGPA / 10) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+0.2</span> from last semester
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{attendancePercentage}%</div>
            <Progress value={attendancePercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <span className={attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'}>
                {attendancePercentage >= 75 ? 'Good' : 'Below minimum'}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Credits</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{completedCredits}/{totalCredits}</div>
            <Progress value={(completedCredits / totalCredits) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {totalCredits - completedCredits} credits remaining
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{subjectPerformance.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This semester
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Subject Performance</CardTitle>
            <CardDescription className="text-muted-foreground">
              Internal marks across all subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectPerformance} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="subject" type="category" width={100} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="marks" fill="#8B0000" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Trend */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Attendance Trend</CardTitle>
            <CardDescription className="text-muted-foreground">
              Monthly attendance percentage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyAttendance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
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

      {/* Assignments and Subject Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Assignments */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Upcoming Assignments</CardTitle>
            <CardDescription className="text-muted-foreground">
              Deadlines and current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{assignment.title}</h4>
                    <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className={getPriorityBadge(assignment.priority)}>
                        {assignment.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className={getStatusBadge(assignment.status)}>
                        {assignment.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subject Summary */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Subject Summary</CardTitle>
            <CardDescription className="text-muted-foreground">
              Quick overview of all subjects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjectPerformance.map((subject, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">{subject.subject}</span>
                  <span className="text-sm font-bold text-foreground">{subject.marks}%</span>
                </div>
                <Progress value={subject.marks} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Attendance: {subject.attendance}%</span>
                  <span className={subject.marks >= 85 ? 'text-green-600' : subject.marks >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                    {subject.marks >= 85 ? 'Excellent' : subject.marks >= 70 ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
