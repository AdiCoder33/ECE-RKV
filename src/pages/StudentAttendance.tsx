import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, AlertTriangle, CheckCircle, XCircle, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const apiBase = import.meta.env.VITE_API_URL || '/api';

interface AttendanceRecord {
  date: string;
  subjectName: string;
  period: number;
  status: 'present' | 'absent';
  professor: string;
  reason?: string;
}

interface SubjectStat {
  subject: string;
  attended: number;
  total: number;
  percentage: number;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface ApiRecord {
  subjectId: string;
  subjectName: string;
  date: string;
  period: number;
  present: number | boolean;
  markedByName: string;
}

const StudentAttendance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const token = localStorage.getItem('token');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
  const [trend, setTrend] = useState<{ month: string; percentage: number }[]>([]);
  const [classesAttended, setClassesAttended] = useState(0);
  const [classesMissed, setClassesMissed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch(`${apiBase}/students/${user?.id}/subjects`, {
          headers: {
            Authorization: 'Bearer ' + token
          }
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          toast({
            title: 'Error',
            description: data.error || data.message || 'Failed to load subjects',
            variant: 'destructive'
          });
          return;
        }
        const data = await response.json();
        setSubjects(data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load subjects',
          variant: 'destructive'
        });
      } finally {
        setSubjectsLoading(false);
      }
    };
    if (user?.id) {
      fetchSubjects();
    }
  }, [user, token, toast]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch(
          `${apiBase}/attendance?studentId=${user?.id}&year=${user?.year}&semester=${user?.semester}`,
          {
            headers: {
              Authorization: 'Bearer ' + token
            }
          }
        );
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          toast({
            title: 'Error',
            description: data.error || data.message || 'Failed to load attendance',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
        const data: ApiRecord[] = await response.json();
        const mappedRecords = data.map((rec: ApiRecord) => ({
          date: rec.date,
          subjectName: rec.subjectName,
          period: rec.period,
          status: rec.present ? 'present' : 'absent',
          professor: rec.markedByName
        }));
        setRecords(mappedRecords);

        let attended = 0;
        data.forEach((rec: ApiRecord) => {
          if (rec.present) attended += 1;
        });

        const totalClasses = data.length;
        const missed = totalClasses - attended;
        setClassesAttended(attended);
        setClassesMissed(missed);

        const monthMap: Record<string, { attended: number; total: number }> = {};
        data.forEach((rec: ApiRecord) => {
          const month = new Date(rec.date).toLocaleString('default', { month: 'short' });
          if (!monthMap[month]) monthMap[month] = { attended: 0, total: 0 };
          monthMap[month].total += 1;
          if (rec.present) monthMap[month].attended += 1;
        });
        const trendData = Object.entries(monthMap).map(([month, m]) => ({
          month,
          percentage: m.total > 0 ? Math.round((m.attended / m.total) * 100) : 0
        }));
        setTrend(trendData);
      } catch (error) {
        console.error('Error fetching attendance:', error);
        toast({
          title: 'Error',
          description: 'Failed to load attendance',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchAttendance();
    }
  }, [user, token, toast]);

  useEffect(() => {
    if (!subjects.length) return;
    const stats = subjects.map(subject => {
      const subjectRecords = records.filter(r => r.subjectName === subject.name);
      const attended = subjectRecords.filter(r => r.status === 'present').length;
      const total = subjectRecords.length;
      const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
      return { subject: subject.name, attended, total, percentage };
    });
    setSubjectStats(stats);
  }, [subjects, records]);

  const filteredAttendance = records.filter(record => {
    const selected = subjects.find(s => s.id === selectedSubject)?.name;
    const matchesSubject = selectedSubject === 'all' || record.subjectName === selected;
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

  const overallAttendance =
    classesAttended + classesMissed > 0
      ? Math.round((classesAttended / (classesAttended + classesMissed)) * 100)
      : 0;
  const belowThreshold = subjectStats.filter(s => s.percentage < 75).length;

  if (loading || subjectsLoading) {
    return <div>Loading...</div>;
  }

  if (!subjects.length) {
    return null;
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 md:px-0">
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
                <p className="text-2xl font-bold">{classesAttended}</p>
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
                <p className="text-2xl font-bold">{classesMissed}</p>
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
                <p className="text-2xl font-bold">{belowThreshold}</p>
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
              <BarChart data={subjectStats}>
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
              <LineChart data={trend}>
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
            {subjectStats.map((subject, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">{subject.subject}</h4>
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
                      <h4 className="font-medium">{record.subjectName}</h4>
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