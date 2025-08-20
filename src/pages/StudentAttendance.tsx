import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, AlertTriangle, CheckCircle, XCircle, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import loaderMp4 from '@/Assets/loader.mp4';

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

const Loader = () => (
  <div className="flex flex-col items-center justify-center min-h-[300px] py-12 px-4">
    <video
      src={loaderMp4}
      autoPlay
      loop
      muted
      playsInline
      className="w-32 h-32 object-contain mb-4 rounded-lg shadow-lg"
      aria-label="Loading animation"
    />
    <div className="text-indigo-700 font-semibold text-lg tracking-wide">Loading Attendance...</div>
    <div className="text-indigo-400 text-sm mt-1">Fetching your attendance, please wait</div>
  </div>
);

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 flex items-center justify-center px-4 md:px-8">
        <Loader />
      </div>
    );
  }

  if (!subjects.length) {
    return null;
  }

  return (
    <div className="min-h-screen space-y-6 px-2 py-4 sm:px-6 md:px-8 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100">
      {/* Add gap between sidebar and main content only on desktop */}
      <div className="hidden md:block" aria-hidden="true">
        <div className="h-0 w-0 md:w-8 lg:w-16 xl:w-24 2xl:w-32 float-left"></div>
      </div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-900">My Attendance</h1>
          <p className="text-indigo-600 mt-2">Track your attendance across all subjects</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-indigo-500">
          <Calendar className="h-4 w-4" />
          Academic Year 2024-25 | Year {user?.year} - Semester {user?.semester}
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 shadow border-0">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-blue-700 font-medium">Overall Attendance</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900">{overallAttendance}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-green-50 to-emerald-100 shadow border-0">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-green-700 font-medium">Classes Attended</p>
              <p className="text-xl sm:text-2xl font-bold text-green-900">{classesAttended}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-red-50 to-pink-100 shadow border-0">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-red-700 font-medium">Classes Missed</p>
              <p className="text-xl sm:text-2xl font-bold text-red-900">{classesMissed}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-yellow-50 to-orange-100 shadow border-0">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-700" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-yellow-700 font-medium">Below 75%</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-900">{belowThreshold}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-xl shadow border-0 bg-gradient-to-br from-white via-blue-50 to-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 text-base sm:text-lg">
              <BarChart className="h-5 w-5 text-blue-600" />
              Subject-wise Attendance
            </CardTitle>
            <CardDescription className="text-blue-500 text-xs sm:text-sm">
              Attendance percentage by subject
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c7d2fe" />
                <XAxis dataKey="subject" stroke="#2563eb" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#2563eb" />
                <Tooltip
                  contentStyle={{
                    background: 'linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 100%)',
                    border: '1px solid #2563eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="percentage" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow border-0 bg-gradient-to-br from-white via-green-50 to-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900 text-base sm:text-lg">
              <TrendingDown className="h-5 w-5 text-green-600" />
              Monthly Trend
            </CardTitle>
            <CardDescription className="text-green-500 text-xs sm:text-sm">
              Attendance trend over months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#bbf7d0" />
                <XAxis dataKey="month" stroke="#16a34a" />
                <YAxis domain={[70, 100]} stroke="#16a34a" />
                <Tooltip
                  contentStyle={{
                    background: 'linear-gradient(135deg, #dcfce7 0%, #f1f5f9 100%)',
                    border: '1px solid #16a34a',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subject Details */}
      <Card className="border-border bg-gradient-to-br from-white via-gray-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-indigo-900">Subject Details</CardTitle>
          <CardDescription className="text-indigo-500">Detailed attendance by subject</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjectStats.map((subject, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-indigo-50 via-white to-gray-50">
                <div className="space-y-1">
                  <h4 className="font-medium text-indigo-900">{subject.subject}</h4>
                  <p className="text-sm text-indigo-600">
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
      <Card className="bg-gradient-to-br from-white via-gray-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-indigo-900">Attendance History</CardTitle>
          <CardDescription className="text-indigo-500">View detailed attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full sm:w-[200px]">
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
              <SelectTrigger className="w-full sm:w-[200px]">
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
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-4 border rounded-lg bg-gradient-to-r from-indigo-50 via-white to-gray-50">
                <div className="flex items-center gap-4">
                  {getStatusIcon(record.status)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-indigo-900">{record.subjectName}</h4>
                      <Badge variant="outline" className="border-indigo-200 text-indigo-700">Period {record.period}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-indigo-600">
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