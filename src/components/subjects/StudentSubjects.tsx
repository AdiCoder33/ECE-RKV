import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import loaderMp4 from '@/Assets/loader.mp4';

interface StudentSubject {
  id: string;
  name: string;
  code: string;
  credits: number;
  type: string;
  marks: number;
  attendance: number;
  status: 'ongoing' | 'completed';
}

const StudentSubjects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<StudentSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const apiBase = import.meta.env.VITE_API_URL || '/api';

  // Loader animation for subjects page
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
      <div className="text-indigo-700 font-semibold text-lg tracking-wide">Loading Subjects...</div>
      <div className="text-indigo-400 text-sm mt-1">Fetching your subjects, please wait</div>
    </div>
  );

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = localStorage.getItem('token');
        if (typeof user?.id !== 'number' || !token) {
          console.warn('Skipping subjects fetch: missing user ID or auth token');
          if (typeof user?.id !== 'number') {
            toast({ variant: 'destructive', title: 'Invalid user ID' });
          }
          return;
        }

        const response = await fetch(`${apiBase}/students/${String(user.id)}/subjects`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const text = await response.text();
          toast({
            variant: 'destructive',
            title: 'Error fetching subjects',
            description: text || 'Failed to fetch subjects'
          });
          setSubjects([]);
          return;
        }

        const cloned = response.clone();

        try {
          const data = await response.json();
          setSubjects(data);
        } catch (parseError) {
          const rawText = await cloned.text();
          console.error('Error parsing subjects response:', rawText, parseError);
          toast({
            variant: 'destructive',
            title: 'Error fetching subjects',
            description: 'Invalid response format'
          });
          setSubjects([]);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast({
          variant: 'destructive',
          title: 'Error fetching subjects',
          description: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [user, toast]);

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMarksColor = (marks: number) => {
    if (marks >= 80) return 'text-green-600';
    if (marks >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 flex items-center justify-center px-4 md:px-8">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 px-2 py-4 sm:px-6 md:px-8 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100">
      {/* Add gap between sidebar and main content only on desktop */}
      <div className="hidden md:block" aria-hidden="true">
        <div className="h-0 w-0 md:w-8 lg:w-16 xl:w-24 2xl:w-32 float-left"></div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-900">My Subjects</h1>
          <p className="text-indigo-600">
            Subjects for Year {user?.year}, Semester {user?.semester} - Section {user?.section}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-indigo-500">
          <Calendar className="h-4 w-4" />
          Academic Year 2024-25 | Year {user?.year} - Semester {user?.semester}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 shadow border-0">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-blue-700 font-medium">Total Subjects</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900">{subjects.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-white via-green-50 to-emerald-100 shadow border-0">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-green-700 font-medium">Avg Marks</p>
              <p className="text-xl sm:text-2xl font-bold text-green-900">
                {subjects.length > 0 ? Math.round(subjects.reduce((acc, s) => acc + s.marks, 0) / subjects.length) : 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-yellow-50 to-orange-100 shadow border-0">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-700" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-yellow-700 font-medium">Avg Attendance</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-900">
                {subjects.length > 0 ? Math.round(subjects.reduce((acc, s) => acc + s.attendance, 0) / subjects.length) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-purple-50 to-indigo-100 shadow border-0">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-purple-700 font-medium">Total Credits</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-900">
                {subjects.reduce((acc, s) => acc + s.credits, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects List */}
      <div className="space-y-4">
        {subjects.length > 0 ? (
          subjects.map((subject) => (
            <Card
              key={subject.id}
              className={
                subject.code.startsWith('AEC')
                  ? 'border-border bg-gradient-to-br from-blue-50 via-blue-100 to-white hover:shadow-lg transition-shadow'
                  : subject.code.startsWith('CS2')
                  ? 'border-border bg-gradient-to-br from-amber-50 via-yellow-100 to-white hover:shadow-lg transition-shadow'
                  : 'border-border bg-gradient-to-br from-white via-gray-50 to-indigo-50 hover:shadow-lg transition-shadow'
              }
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg md:text-xl text-indigo-900">{subject.name}</CardTitle>
                    <p className="text-sm text-indigo-600">{subject.code}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                      {subject.credits} Credits
                    </Badge>
                    <Badge variant={subject.type === 'theory' ? 'outline' : 'default'} className="bg-gray-100 text-gray-700">
                      {subject.type.charAt(0).toUpperCase() + subject.type.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Marks */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-indigo-700">Internal Marks</h4>
                      <span className={`text-sm font-bold ${getMarksColor(subject.marks)}`}>
                        {subject.marks}/100
                      </span>
                    </div>
                    <Progress value={subject.marks} className="h-2 bg-indigo-100" />
                  </div>

                  {/* Attendance */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-indigo-700">Attendance</h4>
                      <span className={`text-sm font-bold ${getAttendanceColor(subject.attendance)}`}>
                        {subject.attendance}%
                      </span>
                    </div>
                    <Progress value={subject.attendance} className="h-2 bg-indigo-100" />
                    {subject.attendance < 75 && (
                      <p className="text-xs text-red-600">⚠️ Below minimum requirement (75%)</p>
                    )}
                  </div>
                </div>

                {/* Performance Indicators */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  {subject.marks >= 80 && (
                    <Badge className="bg-green-100 text-green-800 text-xs">Excellent Performance</Badge>
                  )}
                  {subject.attendance >= 90 && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">Perfect Attendance</Badge>
                  )}
                  {subject.marks < 40 && (
                    <Badge className="bg-red-100 text-red-800 text-xs">Needs Improvement</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-border bg-gradient-to-br from-white via-gray-50 to-indigo-50">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-indigo-900">No Subjects Assigned</h3>
              <p className="text-indigo-600">
                Your subjects for this semester will appear here once they are assigned by the administration.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentSubjects;
