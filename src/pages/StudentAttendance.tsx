import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const StudentAttendance = () => {
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const subjects = [
    { id: 'dsp', name: 'Digital Signal Processing', code: 'EC301' },
    { id: 'vlsi', name: 'VLSI Design', code: 'EC302' },
    { id: 'cn', name: 'Computer Networks', code: 'EC303' },
    { id: 'mp', name: 'Microprocessors', code: 'EC304' },
    { id: 'cs', name: 'Control Systems', code: 'EC305' }
  ];

  const attendanceData = [
    {
      date: '2024-01-15',
      subject: 'Digital Signal Processing',
      period: 1,
      status: 'present',
      professor: 'Dr. Sharma'
    },
    {
      date: '2024-01-15',
      subject: 'VLSI Design',
      period: 2,
      status: 'absent',
      professor: 'Prof. Kumar',
      reason: 'Medical'
    },
    {
      date: '2024-01-16',
      subject: 'Computer Networks',
      period: 1,
      status: 'present',
      professor: 'Dr. Singh'
    },
    {
      date: '2024-01-16',
      subject: 'Digital Signal Processing',
      period: 3,
      status: 'absent',
      professor: 'Dr. Sharma',
      reason: 'Late arrival'
    },
    {
      date: '2024-01-17',
      subject: 'Microprocessors',
      period: 2,
      status: 'present',
      professor: 'Prof. Patel'
    }
  ];

  const subjectAttendance = [
    { subject: 'DSP', attended: 18, total: 20, percentage: 90 },
    { subject: 'VLSI', attended: 16, total: 20, percentage: 80 },
    { subject: 'CN', attended: 19, total: 20, percentage: 95 },
    { subject: 'MP', attended: 15, total: 18, percentage: 83 },
    { subject: 'CS', attended: 17, total: 19, percentage: 89 }
  ];

  const monthlyTrend = [
    { month: 'Aug', percentage: 92 },
    { month: 'Sep', percentage: 88 },
    { month: 'Oct', percentage: 85 },
    { month: 'Nov', percentage: 89 },
    { month: 'Dec', percentage: 87 }
  ];

  const filteredAttendance = attendanceData.filter(record => {
    const matchesSubject = selectedSubject === 'all' || record.subject.toLowerCase().includes(selectedSubject);
    const matchesMonth = selectedMonth === 'all' || new Date(record.date).getMonth() === parseInt(selectedMonth);
    return matchesSubject && matchesMonth;
  });

  const getStatusIcon = (status: string) => {
    return status === 'present' ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (status: string) => {
    return status === 'present' ? 
      'bg-green-600 text-white' : 
      'bg-red-600 text-white';
  };

  const getAttendanceBadge = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-600 text-white';
    if (percentage >= 75) return 'bg-yellow-600 text-white';
    return 'bg-red-600 text-white';
  };

  const overallAttendance = Math.round(
    subjectAttendance.reduce((sum, subject) => sum + subject.percentage, 0) / subjectAttendance.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Attendance</h1>
        <p className="text-muted-foreground mt-2">Track your attendance across all subjects</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall Attendance</p>
                <p className="text-2xl font-bold">{overallAttendance}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classes Attended</p>
                <p className="text-2xl font-bold">85</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classes Missed</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Below 75%</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Attendance</CardTitle>
            <CardDescription>Attendance percentage by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectAttendance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="percentage" fill="#8B0000" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>Attendance trend over months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
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
                <Line type="monotone" dataKey="percentage" stroke="#001F54" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subject Details */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Details</CardTitle>
          <CardDescription>Detailed attendance by subject</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjectAttendance.map((subject, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">{subjects.find(s => s.name.includes(subject.subject))?.name || subject.subject}</h4>
                  <p className="text-sm text-muted-foreground">
                    {subject.attended} of {subject.total} classes attended
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge className={getAttendanceBadge(subject.percentage)}>
                      {subject.percentage}%
                    </Badge>
                    {subject.percentage < 75 && (
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingDown className="h-3 w-3 text-red-600" />
                        <span className="text-xs text-red-600">Below minimum</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>View detailed attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value="0">January</SelectItem>
                <SelectItem value="1">February</SelectItem>
                <SelectItem value="2">March</SelectItem>
                <SelectItem value="11">December</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredAttendance.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getStatusIcon(record.status)}
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{record.subject}</h4>
                      <Badge variant="outline">Period {record.period}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{new Date(record.date).toLocaleDateString()}</span>
                      <span>{record.professor}</span>
                      {record.reason && <span className="text-red-600">Reason: {record.reason}</span>}
                    </div>
                  </div>
                </div>

                <Badge className={getStatusBadge(record.status)}>
                  {record.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAttendance;