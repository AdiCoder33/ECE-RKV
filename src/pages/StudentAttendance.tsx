import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, AlertTriangle, CheckCircle, XCircle, TrendingDown, BarChart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';
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

// Enhanced ECE Theme colors matching all student pages (red/indigo/blue palette)
const THEME = {
  bgBeige: '#fbf4ea',
  accent: '#b91c1c', // red-700 for headings and highlights
  accentHover: '#a52a2a',
  cardBg: '#fff',
  cardShadow: 'shadow-lg',
  textMuted: '#64748b',
  textPrimary: '#1a1a1a',
  textSecondary: '#2c2c2c',
  textSilver: '#6b7280',
  redLight: '#fee2e2', // red-100
  redBorder: '#fecaca', // red-200
  blueLight: '#eef2ff', // indigo-50
  blueBorder: '#c7d2fe', // indigo-200
};

// ECE-themed loader matching other components
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
    <div className="font-semibold text-lg tracking-wide" style={{ color: THEME.accent }}>Loading Attendance...</div>
    <div className="text-sm mt-1" style={{ color: THEME.textSilver }}>Fetching your attendance, please wait</div>
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
            description: data.message || 'Failed to load subjects',
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
            description: data.message || 'Failed to load attendance',
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
      <div className="min-h-screen flex items-center justify-center px-4 md:px-8" style={{ backgroundColor: THEME.bgBeige }}>
        <Loader />
      </div>
    );
  }

  if (!subjects.length) {
    return null;
  }

  return (
    <div className="min-h-screen space-y-6 px-2 py-4 sm:px-4 md:px-8" style={{ backgroundColor: THEME.bgBeige }}>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Card className="rounded-xl shadow border-0 bg-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: THEME.accent }}>
                  My Attendance
                </h1>
                <p className="mt-2 font-medium" style={{ color: THEME.textSecondary }}>
                  Track your attendance across all subjects
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#b91c1c] bg-[#fee2e2] px-3 py-2 rounded-lg border border-[#fecaca]">
                <Calendar className="h-4 w-4 text-[#b91c1c]" />
                Academic Year 2024-25 | Year {user?.year} - Semester {user?.semester}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Overall Attendance */}
        <Card className={`rounded-xl shadow border-0 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50`}>
          <CardContent className="p-4 sm:p-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Calendar className="h-5 w-5 text-[#2563eb]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-[#2563eb]">Overall Attendance</p>
              <p className="text-xl sm:text-2xl font-bold text-[#2563eb]">{overallAttendance}%</p>
            </div>
          </CardContent>
        </Card>
        {/* Classes Attended */}
        <Card className={`rounded-xl shadow border-0 bg-gradient-to-br from-green-100 via-teal-50 to-blue-50`}>
          <CardContent className="p-4 sm:p-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-green-700">Classes Attended</p>
              <p className="text-xl sm:text-2xl font-bold text-green-700">{classesAttended}</p>
            </div>
          </CardContent>
        </Card>
        {/* Classes Missed */}
        <Card className={`rounded-xl shadow border-0 bg-gradient-to-br from-red-100 via-orange-50 to-yellow-50`}>
          <CardContent className="p-4 sm:p-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#fee2e2]">
              <XCircle className="h-5 w-5 text-[#b91c1c]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-[#b91c1c]">Classes Missed</p>
              <p className="text-xl sm:text-2xl font-bold text-[#b91c1c]">{classesMissed}</p>
            </div>
          </CardContent>
        </Card>
        {/* Below 75% */}
        <Card className={`rounded-xl shadow border-0 bg-gradient-to-br from-yellow-100 via-orange-50 to-red-50`}>
          <CardContent className="p-4 sm:p-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-50">
              <AlertTriangle className="h-5 w-5 text-yellow-700" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-yellow-700">Below 75%</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-700">{belowThreshold}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-wise Attendance */}
        <Card className={`rounded-xl shadow border-0 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50`}>
          <CardHeader className="rounded-t-xl bg-[#eef2ff]">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold" style={{ color: THEME.accent }}>
              <BarChart className="h-5 w-5" />
              Subject-wise Attendance
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-medium" style={{ color: THEME.textSilver }}>
              Attendance percentage by subject
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={subjectStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis 
                  dataKey="subject" 
                  stroke={THEME.accent}
                  fontSize={12} 
                  fontWeight={600}
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke={THEME.accent}
                  fontWeight={600}
                />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: `2px solid ${THEME.accent}`,
                    borderRadius: '12px',
                    color: THEME.textPrimary,
                    fontWeight: 600,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
                  }}
                />
                <Bar 
                  dataKey="percentage" 
                  fill={THEME.accent} 
                  radius={[4, 4, 0, 0]} 
                  barSize={28}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Monthly Trend */}
        <Card className={`rounded-xl shadow border-0 bg-gradient-to-br from-yellow-100 via-orange-50 to-red-50`}>
          <CardHeader className="rounded-t-xl bg-[#fff7ed]">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold" style={{ color: THEME.accent }}>
              <TrendingDown className="h-5 w-5" />
              Monthly Trend
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-medium" style={{ color: THEME.textSilver }}>
              Attendance trend over months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke={THEME.accent}
                  fontWeight={600}
                />
                <YAxis 
                  domain={[70, 100]} 
                  stroke={THEME.accent}
                  fontWeight={600}
                />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: `2px solid ${THEME.accent}`,
                    borderRadius: '12px',
                    color: THEME.textPrimary,
                    fontWeight: 600,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke={THEME.accent}
                  strokeWidth={3}
                  dot={{ fill: THEME.accent, strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subject Details */}
      <Card className="rounded-xl shadow border-0 bg-white">
        <CardHeader className="rounded-t-xl bg-[#fee2e2]">
          <CardTitle className="font-bold" style={{ color: THEME.accent }}>Subject Details</CardTitle>
          <CardDescription className="font-medium" style={{ color: THEME.textSilver }}>Detailed attendance by subject</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjectStats.map((subject, index) => (
              <div 
                key={index} 
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 border rounded-lg transition-all hover:shadow-md"
                style={{ 
                  backgroundColor: THEME.redLight,
                  borderColor: THEME.redBorder,
                  borderWidth: 1
                }}
              >
                <div className="space-y-1">
                  <h4 className="font-bold" style={{ color: THEME.accent }}>{subject.subject}</h4>
                  <p className="text-sm font-medium" style={{ color: THEME.textSecondary }}>
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
                        <span className="text-xs text-red-600 font-medium">Below minimum</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and History */}
      <Card className="rounded-xl shadow border-0 bg-white">
        <CardHeader className="rounded-t-xl bg-[#eef2ff]">
          <CardTitle className="font-bold" style={{ color: THEME.accent }}>Attendance History</CardTitle>
          <CardDescription className="font-medium" style={{ color: THEME.textSilver }}>View detailed attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger 
                className="w-full sm:w-[200px] border-2 bg-[#eef2ff] text-[#2563eb] font-semibold"
                style={{ borderColor: THEME.blueBorder }}
              >
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
              <SelectTrigger 
                className="w-full sm:w-[200px] border-2 bg-[#eef2ff] text-[#2563eb] font-semibold"
                style={{ borderColor: THEME.blueBorder }}
              >
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
              <div 
                key={index} 
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 border rounded-lg transition-all hover:shadow-md"
                style={{ 
                  backgroundColor: THEME.blueLight,
                  borderColor: THEME.blueBorder,
                  borderWidth: 1
                }}
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(record.status)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold" style={{ color: THEME.accent }}>{record.subjectName}</h4>
                      <Badge 
                        variant="outline" 
                        className="border-2 font-medium"
                        style={{ borderColor: THEME.accent, color: THEME.textSecondary }}
                      >
                        Period {record.period}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium" style={{ color: THEME.textSecondary }}>
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