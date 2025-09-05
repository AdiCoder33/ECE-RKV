import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  GraduationCap,
  TrendingUp,
  Award,
  Calendar,
  BarChart3,
  Target
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import loaderMp4 from '@/Assets/loader.mp4';

interface Mark {
  id: string;
  subject: string;
  examType: string;
  marks: number;
  maxMarks: number;
  date: string;
  grade: string;
}

interface MidRecord {
  id: string;
  type: string;
  marks: number;
  maxMarks: number;
  date: string;
}

interface SubjectStat {
  subjectId: number;
  subjectName: string;
  obtained: number;
  total: number;
  percentage: number;
  mids: MidRecord[];
  internal: {
    obtained: number;
    total: number;
  };
}

interface SubjectRecord {
  subjectId: number;
  subjectName: string;
  mids: MidRecord[];
  internal: {
    obtained: number;
    total: number;
  };
}

interface TrendPoint {
  month: string;
  percentage: number;
}

interface Overall {
  obtained: number;
  total: number;
  percentage: number;
}

// Blue/Indigo Theme (matches dashboard, avoids green/yellow/orange/pink)
const gradientCard = 'bg-gradient-to-br from-blue-500 via-indigo-400 to-purple-400 text-white shadow-lg';
const gradientMetrics = [
  'bg-gradient-to-br from-cyan-500 via-blue-400 to-indigo-400 text-white shadow-md',
  'bg-gradient-to-br from-pink-500 via-red-400 to-orange-400 text-white shadow-md',
  'bg-gradient-to-br from-green-400 via-teal-400 to-blue-400 text-white shadow-md',
  'bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 text-white shadow-md'
];

const THEME = {
  bgBeige: '#fbf4ea',
  accent: '#6366f1',
  accent2: '#2563eb',
  cardBg: '#fff',
  cardShadow: 'shadow-lg',
  textMuted: '#64748b',
  textPrimary: '#1e293b',
  textSecondary: '#334155',
  textSilver: '#64748b',
  red: '#b91c1c', // red-700
  redBorder: 'border-2 border-[#fca5a5]' // light red-300
};

const StudentMarks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [subjects, setSubjects] = useState<{ value: string; label: string }[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<TrendPoint[]>([]);
  const [overall, setOverall] = useState<Overall>({ obtained: 0, total: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchMarks = async () => {
      if (typeof user?.id !== 'number' || !token) {
        console.warn('Skipping marks fetch: missing user ID or auth token');
        return;
      }

      try {
        const response = await fetch(`${apiBase}/marks/student/${user.id}/summary`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const text = await response.text();
          toast({
            variant: 'destructive',
            title: 'Error fetching marks',
            description: text || 'Failed to fetch marks'
          });
          setMarks([]);
          setSubjects([]);
          setSubjectStats([]);
          setMonthlyTrend([]);
          setOverall({ obtained: 0, total: 0, percentage: 0 });
          return;
        }

        const cloned = response.clone();

        try {
          const data = await response.json();
          const mapped: Mark[] = (data.records || []).flatMap((row: SubjectRecord) =>
            row.mids.map((mid) => {
              const percent = (mid.marks / mid.maxMarks) * 100;
              const grade =
                percent >= 90
                  ? 'A+'
                  : percent >= 80
                  ? 'A'
                  : percent >= 70
                  ? 'B+'
                  : percent >= 60
                  ? 'B'
                  : 'C';
              return {
                id: String(mid.id),
                subject: row.subjectName,
                examType: mid.type,
                marks: mid.marks,
                maxMarks: mid.maxMarks,
                date: mid.date,
                grade
              };
            })
          );

          setMarks(mapped);
          setSubjectStats(data.subjectStats || []);
          setMonthlyTrend(data.monthlyTrend || []);
          setOverall(data.overall || { obtained: 0, total: 0, percentage: 0 });
          const subjOptions = (data.subjectStats || []).map((s: SubjectStat) => ({
            value: s.subjectName,
            label: s.subjectName
          }));
          setSubjects([{ value: 'all', label: 'All Subjects' }, ...subjOptions]);
        } catch (parseError) {
          const rawText = await cloned.text();
          console.error('Error parsing marks response:', rawText, parseError);
          toast({
            variant: 'destructive',
            title: 'Error fetching marks',
            description: 'Invalid response format'
          });
          setMarks([]);
          setSubjects([]);
          setSubjectStats([]);
          setMonthlyTrend([]);
          setOverall({ obtained: 0, total: 0, percentage: 0 });
        }
      } catch (error) {
        console.error('Error fetching marks:', error);
        toast({
          variant: 'destructive',
          title: 'Error fetching marks',
          description: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
        setMarks([]);
        setSubjects([]);
        setSubjectStats([]);
        setMonthlyTrend([]);
        setOverall({ obtained: 0, total: 0, percentage: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchMarks();
  }, [user, token, apiBase, toast]);

  const filteredMarks = selectedSubject === 'all'
    ? marks
    : marks.filter(mark => mark.subject === selectedSubject);

  const { obtained: totalMarks, total: totalMaxMarks, percentage: overallPercentage } = overall;

  const chartData = subjectStats.map(stat => ({
    subject: stat.subjectName.replace(' ', '\n'),
    percentage: (stat.percentage ?? 0).toFixed(1),
    marks: stat.obtained,
    maxMarks: stat.total
  }));

  const performanceTrend = monthlyTrend.map(t => ({
    month: t.month,
    percentage: Number((t.percentage ?? 0).toFixed(1))
  }));

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-green-500';
      case 'A': return 'bg-blue-500';
      case 'B+': return 'bg-yellow-500';
      case 'B': return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-600' };
    if (percentage >= 80) return { level: 'Very Good', color: 'text-blue-600' };
    if (percentage >= 70) return { level: 'Good', color: 'text-yellow-600' };
    if (percentage >= 60) return { level: 'Average', color: 'text-orange-600' };
    return { level: 'Needs Improvement', color: 'text-red-600' };
  };

  const performance = getPerformanceLevel(overallPercentage);

  // ECE-themed loader matching UserManagement
  const EceVideoLoader = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
      <video
        src={loaderMp4}
        autoPlay
        loop
        muted
        playsInline
        className="w-40 h-40 object-contain mb-4 rounded-lg shadow-lg"
        aria-label="Loading animation"
      />
      <div style={{ color: THEME.accent }} className="font-semibold text-lg tracking-wide">Loading Marks...</div>
      <div style={{ color: THEME.accentHover }} className="text-sm mt-1">Fetching your marks, please wait</div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-0 flex items-center justify-center min-h-screen" style={{ backgroundColor: THEME.bgBeige }}>
        <EceVideoLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-2 py-4 sm:px-4 md:px-8" style={{ backgroundColor: THEME.bgBeige }}>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Card className="rounded-xl shadow bg-white">
          <CardContent className="p-4 sm:p-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: THEME.red }}>
                My Marks
              </h1>
              <p className="text-base font-medium" style={{ color: THEME.textMuted }}>
                View your academic performance and progress
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-xl shadow bg-white mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="flex-1">
              <label className="text-sm font-bold mb-2 block" style={{ color: THEME.accent2 }}>
                Subject Filter
              </label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger
                  className="border-2 focus:border-indigo-400 shadow-md bg-indigo-50 text-indigo-900 font-semibold"
                  style={{
                    borderColor: '#c7d2fe',
                    backgroundColor: '#eef2ff',
                    color: '#3730a3'
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white text-indigo-900 font-semibold">
                  {subjects.map(subject => (
                    <SelectItem
                      key={subject.value}
                      value={subject.value}
                      className="hover:bg-indigo-100 text-indigo-900 font-semibold"
                    >
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-bold mb-2 block" style={{ color: THEME.accent2 }}>
                Semester
              </label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger
                  className="border-2 focus:border-indigo-400 shadow-md bg-indigo-50 text-indigo-900 font-semibold"
                  style={{
                    borderColor: '#c7d2fe',
                    backgroundColor: '#eef2ff',
                    color: '#3730a3'
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white text-indigo-900 font-semibold">
                  <SelectItem value="current" className="hover:bg-indigo-100 text-indigo-900 font-semibold">
                    Current Semester
                  </SelectItem>
                  <SelectItem value="previous" className="hover:bg-indigo-100 text-indigo-900 font-semibold">
                    Previous Semester
                  </SelectItem>
                  <SelectItem value="all" className="hover:bg-indigo-100 text-indigo-900 font-semibold">
                    All Semesters
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        {/* Overall Performance */}
        <Card className={`rounded-lg shadow ${THEME.redBorder} ${gradientMetrics[0]}`}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 rounded-lg bg-white/20">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white font-medium">Overall Performance</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  {overallPercentage != null ? `${(overallPercentage ?? 0).toFixed(1)}%` : '–'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Total Marks */}
        <Card className={`rounded-lg shadow ${THEME.redBorder} ${gradientMetrics[1]}`}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 rounded-lg bg-white/20">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white font-medium">Total Marks</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  {Math.round(totalMarks)}/{Math.round(totalMaxMarks)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Subjects */}
        <Card className={`rounded-lg shadow ${THEME.redBorder} ${gradientMetrics[2]}`}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 rounded-lg bg-white/20">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white font-medium">Subjects</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  {subjectStats.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Trend */}
        <Card className={`rounded-lg shadow ${THEME.redBorder} ${gradientMetrics[3]}`}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 rounded-lg bg-white/20">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white font-medium">Trend</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  +3.2%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Subject-wise Performance */}
        <Card className="rounded-xl shadow bg-white">
          <CardHeader className="rounded-t-xl bg-indigo-50">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold" style={{ color: THEME.accent }}>
              <BarChart3 className="h-5 w-5" />
              Subject-wise Performance
            </CardTitle>
            <CardDescription className="text-sm font-medium" style={{ color: THEME.textSilver }}>
              Internal marks across all subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[220px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                  <XAxis
                    dataKey="subject"
                    stroke={THEME.accent}
                    fontSize={12}
                    fontWeight={600}
                  />
                  <YAxis stroke={THEME.accent} fontWeight={600} />
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
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        {/* Performance Trend */}
        <Card className="rounded-xl shadow bg-white">
          <CardHeader className="rounded-t-xl bg-indigo-50">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold" style={{ color: THEME.accent }}>
              <TrendingUp className="h-5 w-5" />
              Performance Trend
            </CardTitle>
            <CardDescription className="text-sm font-medium" style={{ color: THEME.textSilver }}>
              Monthly performance trend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[220px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                  <XAxis dataKey="month" stroke={THEME.accent} fontWeight={600} />
                  <YAxis domain={[70, 100]} stroke={THEME.accent} fontWeight={600} />
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
                    dot={{ fill: THEME.accent2, strokeWidth: 2, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add space between charts and assessments */}
      <div className="my-8" />

      {/* Recent Assessments Table */}
      <Card className="rounded-xl shadow bg-white">
        <CardHeader className="rounded-t-xl bg-indigo-50">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold" style={{ color: THEME.accent }}>
            <Calendar className="h-5 w-5" />
            Recent Assessments
          </CardTitle>
          <CardDescription className="text-sm font-medium" style={{ color: THEME.textSilver }}>
            All your recent marks and grades
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Group by subject and show mids in a row */}
          <div className="space-y-6">
            {subjectStats.length > 0 ? (
              subjectStats.map((subject, idx) => (
                <div
                  key={subject.subjectId}
                  className={`border rounded-lg p-4 mb-2 bg-indigo-50${idx !== 0 ? ' mt-6' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                    <div className="font-bold text-lg" style={{ color: THEME.textPrimary }}>
                      {subject.subjectName}
                    </div>
                    <div className="flex gap-4 mt-2 sm:mt-0">
                      {subject.mids.map((mid) => (
                        <div key={mid.id} className="flex flex-col items-center px-2">
                          <div className="font-semibold text-sm" style={{ color: THEME.textSecondary }}>
                            {mid.type}
                          </div>
                          <div className="text-base font-bold" style={{ color: THEME.textPrimary }}>
                            {Math.round(Number(mid.marks) || 0)}/{Math.round(Number(mid.maxMarks) || 0)}
                          </div>
                          <div className="text-xs" style={{ color: THEME.textSilver }}>
                            {mid.date ? new Date(mid.date).toLocaleDateString() : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div 
                  className="p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border-2 shadow-lg"
                  style={{ 
                    background: `linear-gradient(45deg, #e0e7ff, #c7d2fe)`,
                    borderColor: THEME.red
                  }}
                >
                  <Calendar className="h-8 w-8 text-white drop-shadow" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: THEME.textPrimary }}>
                  No Marks Available
                </h3>
                <p className="font-medium" style={{ color: THEME.textSilver }}>
                  Your assessment marks will appear here once they are uploaded by faculty.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentMarks;
