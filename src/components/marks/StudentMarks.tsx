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

const StudentMarks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [subjects, setSubjects] = useState<{ value: string; label: string }[]>([]);
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
        const response = await fetch(`${apiBase}/marks/student/${user.id}`, {
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
          return;
        }

        const cloned = response.clone();

        try {
          const data = await response.json();
          const mapped: Mark[] = data.map((row: any) => {
            const percent = (row.marks / row.max_marks) * 100;
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
              id: String(row.id),
              subject: row.subject_name,
              examType: row.type,
              marks: row.marks,
              maxMarks: row.max_marks,
              date: row.date,
              grade
            };
          });

          setMarks(mapped);
          const uniqueSubjects = Array.from(new Set(mapped.map(m => m.subject))).map(sub => ({
            value: sub,
            label: sub
          }));
          setSubjects([{ value: 'all', label: 'All Subjects' }, ...uniqueSubjects]);
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
      } finally {
        setLoading(false);
      }
    };

    fetchMarks();
  }, [user, token, apiBase, toast]);

  const filteredMarks = selectedSubject === 'all'
    ? marks
    : marks.filter(mark => mark.subject === selectedSubject);

  // Calculate statistics
  const totalMarks = filteredMarks.reduce((sum, mark) => sum + mark.marks, 0);
  const totalMaxMarks = filteredMarks.reduce((sum, mark) => sum + mark.maxMarks, 0);
  const overallPercentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;

  // Subject-wise performance
  const subjectPerformance = marks.reduce((acc, mark) => {
    if (!acc[mark.subject]) {
      acc[mark.subject] = { total: 0, maxTotal: 0, count: 0 };
    }
    acc[mark.subject].total += mark.marks;
    acc[mark.subject].maxTotal += mark.maxMarks;
    acc[mark.subject].count += 1;
    return acc;
  }, {} as Record<string, { total: number; maxTotal: number; count: number }>);

  const chartData = Object.entries(subjectPerformance).map(([subject, data]) => ({
    subject: subject.replace(' ', '\n'),
    percentage: ((data.total / data.maxTotal) * 100).toFixed(1),
    marks: data.total,
    maxMarks: data.maxTotal
  }));

  const performanceTrend = marks
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(m => ({
      month: new Date(m.date).toLocaleString('default', { month: 'short' }),
      percentage: Number(((m.marks / m.maxMarks) * 100).toFixed(1))
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
            <div className="text-2xl font-bold">{Object.keys(subjectPerformance).length}</div>
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
