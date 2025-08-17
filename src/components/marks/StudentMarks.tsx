import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-0">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            My Marks
          </h1>
          <p className="text-muted-foreground mt-2">View your academic performance and progress</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Performance</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallPercentage.toFixed(1)}%</div>
            <Progress value={overallPercentage} className="mt-2" />
            <p className={`text-xs mt-1 ${performance.color}`}>
              {performance.level}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Marks</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMarks}/{totalMaxMarks}</div>
            <p className="text-xs text-muted-foreground">
              Across {filteredMarks.length} assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <GraduationCap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectStats.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently enrolled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+3.2%</div>
            <p className="text-xs text-muted-foreground">
              From last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Subject-wise Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="subject" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceTrend}>
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
                  dataKey="percentage" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Marks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Assessments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMarks.map((mark) => (
              <div key={mark.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{mark.subject}</h4>
                  <p className="text-sm text-muted-foreground">{mark.examType}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(mark.date).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="text-center mx-4">
                  <div className="text-2xl font-bold text-foreground">
                    {mark.marks}/{mark.maxMarks}
                  </div>
                  <div className="text-sm text-muted-foreground">
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
