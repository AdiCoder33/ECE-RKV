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
    percentage: stat.percentage.toFixed(1),
    marks: stat.obtained,
    maxMarks: stat.total
  }));

  const performanceTrend = monthlyTrend.map(t => ({
    month: t.month,
    percentage: Number(t.percentage.toFixed(1))
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

  // Loader component
  const Loader = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
      <video
        src={loaderMp4}
        autoPlay
        loop
        muted
        playsInline
        className="w-32 h-32 object-contain mb-4 rounded-lg shadow-lg"
        aria-label="Loading animation"
      />
      <div className="text-indigo-700 font-semibold text-lg tracking-wide">Loading Marks...</div>
      <div className="text-indigo-400 text-sm mt-1">Fetching your marks, please wait</div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 px-2 py-4 sm:px-6 md:px-12 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            My Marks
          </h1>
          <p className="text-muted-foreground mt-2">View your academic performance and progress</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-white via-fuchsia-50 to-orange-50 border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Subject Filter</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Semester</label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Semester</SelectItem>
                  <SelectItem value="previous">Previous Semester</SelectItem>
                  <SelectItem value="all">All Semesters</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-purple-500 via-fuchsia-400 to-pink-400 text-white shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Overall Performance</CardTitle>
            <Target className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{overallPercentage.toFixed(1)}%</div>
            <Progress value={overallPercentage} className="mt-2 bg-white/30" />
            <p className={`text-xs mt-1 ${performance.color}`}>
              {performance.level}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-400 via-pink-400 to-fuchsia-400 text-white shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Marks</CardTitle>
            <Award className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalMarks}/{totalMaxMarks}</div>
            <p className="text-xs text-white/80">
              Across {filteredMarks.length} assessments
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-400 via-cyan-400 to-blue-400 text-white shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Subjects</CardTitle>
            <GraduationCap className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{subjectStats.length}</div>
            <p className="text-xs text-white/80">
              Currently enrolled
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 text-white shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Trend</CardTitle>
            <TrendingUp className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-100">+3.2%</div>
            <p className="text-xs text-white/80">
              From last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Subject-wise Performance */}
        <Card className="rounded-xl shadow border-0 bg-gradient-to-br from-white via-blue-50 to-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 text-base sm:text-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Subject-wise Performance
            </CardTitle>
            <CardDescription className="text-blue-500 text-xs sm:text-sm">
              Internal marks across all subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[220px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c7d2fe" />
                  <XAxis
                    dataKey="subject"
                    stroke="#2563eb"
                    fontSize={12}
                  />
                  <YAxis stroke="#2563eb" />
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
            </div>
          </CardContent>
        </Card>

        {/* Performance Trend */}
        <Card className="rounded-xl shadow border-0 bg-gradient-to-br from-white via-green-50 to-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900 text-base sm:text-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Performance Trend
            </CardTitle>
            <CardDescription className="text-green-500 text-xs sm:text-sm">
              Monthly performance trend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[220px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrend}>
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Marks Table */}
      <Card className="rounded-xl shadow border-0 bg-gradient-to-br from-white via-gray-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900 text-base sm:text-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
            Recent Assessments
          </CardTitle>
          <CardDescription className="text-blue-500 text-xs sm:text-sm">
            All your recent marks and grades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {filteredMarks.map((mark) => (
              <div
                key={mark.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 sm:p-4 border rounded-lg hover:bg-blue-50/60 transition-colors"
              >
                <div className="flex-1 w-full">
                  <h4 className="font-semibold text-indigo-900 text-base">{mark.subject}</h4>
                  <p className="text-sm text-indigo-600">{mark.examType}</p>
                  <p className="text-xs text-indigo-400">
                    {new Date(mark.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-center mx-0 sm:mx-4">
                  <div className="text-xl sm:text-2xl font-bold text-indigo-900">
                    {mark.marks}/{mark.maxMarks}
                  </div>
                  <div className="text-sm text-indigo-600">
                    {((mark.marks / mark.maxMarks) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    className={`${getGradeColor(mark.grade)} text-white`}
                  >
                    {mark.grade}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentMarks;
