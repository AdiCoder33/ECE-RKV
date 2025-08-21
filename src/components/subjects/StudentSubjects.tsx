import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

// Dashboard-like THEME
const THEME = {
  bgBeige: '#fbf4ea',
  accent: '#b91c1c', // red-700 for headings
  accent2: '#b91c1c', // red-700 for highlights
  cardBg: '#fff',
  cardShadow: 'shadow-lg',
  textMuted: '#64748b',
  textPrimary: '#1e293b',
  textSecondary: '#334155',
  textSilver: '#64748b',
  red: '#b91c1c',
  redLight: '#fee2e2', // red-100
};

const gradientCard = 'bg-gradient-to-br from-blue-500 via-indigo-400 to-purple-400 text-white shadow-lg';
const gradientMetrics = [
  'bg-gradient-to-br from-cyan-500 via-blue-400 to-indigo-400 text-white shadow-md',
  'bg-gradient-to-br from-pink-500 via-red-400 to-orange-400 text-white shadow-md',
  'bg-gradient-to-br from-green-400 via-teal-400 to-blue-400 text-white shadow-md',
  'bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 text-white shadow-md'
];
const gradientIcon = 'bg-white/20';

const StudentSubjects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<StudentSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const apiBase = import.meta.env.VITE_API_URL || '/api';

  // Loader
  const EceVideoLoader = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] py-12 px-4">
      <video
        src={loaderMp4}
        autoPlay
        loop
        muted
        playsInline
        className="w-40 h-40 object-contain mb-4 rounded-lg shadow-lg"
        aria-label="Loading animation"
      />
      <div style={{ color: THEME.accent }} className="font-semibold text-lg tracking-wide">Loading Subjects...</div>
      <div style={{ color: THEME.accent2 }} className="text-sm mt-1">Fetching your subjects, please wait</div>
    </div>
  );

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = localStorage.getItem('token');
        if (typeof user?.id !== 'number' || !token) {
          if (typeof user?.id !== 'number') {
            toast({ variant: 'destructive', title: 'Invalid user ID' });
          }
          return;
        }
        const response = await fetch(`${apiBase}/students/${String(user.id)}/subjects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          toast({
            variant: 'destructive',
            title: 'Error fetching subjects',
            description: (await response.text()) || 'Failed to fetch subjects'
          });
          setSubjects([]);
          return;
        }
        setSubjects(await response.json());
      } catch (error) {
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
  }, [user, toast, apiBase]);

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return 'text-blue-700';
    if (percentage >= 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getMarksColor = (marks: number) => {
    if (marks >= 80) return 'text-indigo-700';
    if (marks >= 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  if (loading) {
    return (
      <div className="p-0 flex items-center justify-center min-h-screen" style={{ backgroundColor: THEME.bgBeige }}>
        <EceVideoLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-2 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8" style={{ backgroundColor: THEME.bgBeige }}>
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <Card className="rounded-xl shadow bg-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1" style={{ color: THEME.accent }}>
                  My Subjects
                </h1>
                <p className="text-sm sm:text-base" style={{ color: THEME.textMuted }}>
                  Year {user?.year}, Semester {user?.semester} - Section {user?.section}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#b91c1c] bg-[#fee2e2] px-3 py-2 rounded-lg border border-[#fecaca]">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-[#b91c1c]" />
                <span className="hidden sm:inline">Academic Year 2024-25 |</span>
                <span>Y{user?.year}-S{user?.semester}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        {/* Total Subjects */}
        <Card className={`rounded-lg shadow ${gradientMetrics[0]}`}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`p-2 rounded-lg ${gradientIcon}`}>
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white font-medium">Total</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  {subjects.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Average Marks */}
        <Card className={`rounded-lg shadow ${gradientMetrics[1]}`}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`p-2 rounded-lg ${gradientIcon}`}>
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white font-medium">Avg Marks</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  {subjects.length > 0 ? Math.round(subjects.reduce((acc, s) => acc + s.marks, 0) / subjects.length) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Attendance */}
        <Card className={`rounded-lg shadow ${gradientMetrics[2]}`}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`p-2 rounded-lg ${gradientIcon}`}>
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white font-medium">Attendance</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  {subjects.length > 0 ? Math.round(subjects.reduce((acc, s) => acc + s.attendance, 0) / subjects.length) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Credits */}
        <Card className={`rounded-lg shadow ${gradientMetrics[3]}`}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`p-2 rounded-lg ${gradientIcon}`}>
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white font-medium">Credits</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  {subjects.reduce((acc, s) => acc + s.credits, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects List */}
      <div className="space-y-4 sm:space-y-6">
        {subjects.length > 0 ? (
          subjects.map((subject) => (
            <Card
              key={subject.id}
              className="rounded-xl shadow bg-white hover:shadow-xl transition-all duration-300"
            >
              <CardHeader className="pb-3 border-b border-[#fee2e2] bg-[#fff1f2] rounded-t-xl">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg md:text-xl leading-tight text-[#b91c1c]">
                      {subject.name}
                    </CardTitle>
                    <p className="text-sm text-[#b91c1c] mt-1">{subject.code}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-[#fee2e2] border text-xs text-[#b91c1c] border-[#fecaca]">
                      {subject.credits} Credits
                    </Badge>
                    <Badge 
                      variant="outline"
                      className="bg-[#fff1f2] text-[#b91c1c] border-[#fecaca] text-xs"
                    >
                      {subject.type.charAt(0).toUpperCase() + subject.type.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6 space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Internal Marks */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-[#b91c1c]">Internal Marks</h4>
                      <span className={`text-sm font-bold ${getMarksColor(subject.marks)}`}>
                        {subject.marks}/100
                      </span>
                    </div>
                    <div className="w-full bg-[#fee2e2] rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${subject.marks}%`,
                          backgroundColor: subject.marks >= 80 ? '#6366f1' : subject.marks >= 60 ? '#f59e0b' : '#ef4444'
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Attendance */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-[#b91c1c]">Attendance</h4>
                      <span className={`text-sm font-bold ${getAttendanceColor(subject.attendance)}`}>
                        {subject.attendance}%
                      </span>
                    </div>
                    <div className="w-full bg-[#fee2e2] rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${subject.attendance}%`,
                          backgroundColor: subject.attendance >= 75 ? '#2563eb' : subject.attendance >= 60 ? '#f59e0b' : '#ef4444'
                        }}
                      ></div>
                    </div>
                    {subject.attendance < 75 && (
                      <p className="text-xs text-red-700 font-medium">⚠️ Below minimum requirement (75%)</p>
                    )}
                  </div>
                </div>

                {/* Performance Indicators */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-[#fee2e2]">
                  {subject.marks >= 80 && (
                    <Badge className="bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca] text-xs">
                      Excellent Performance
                    </Badge>
                  )}
                  {subject.attendance >= 90 && (
                    <Badge className="bg-blue-100 text-blue-800 border border-blue-300 text-xs">
                      Perfect Attendance
                    </Badge>
                  )}
                  {subject.marks < 40 && (
                    <Badge className="bg-red-100 text-red-800 border border-red-300 text-xs">
                      Needs Improvement
                    </Badge>
                  )}
                  {subject.marks >= 70 && subject.attendance >= 75 && (
                    <Badge className="bg-[#fff1f2] border text-xs text-[#b91c1c] border-[#fecaca]">
                      On Track
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="rounded-xl shadow bg-white">
            <CardContent className="p-6 sm:p-8 text-center">
              <div 
                className="p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border-2"
                style={{ 
                  backgroundColor: '#fee2e2',
                  borderColor: '#b91c1c'
                }}
              >
                <BookOpen className="h-8 w-8 text-[#b91c1c]" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[#b91c1c]">
                No Subjects Assigned
              </h3>
              <p className="text-[#b91c1c] text-sm sm:text-base">
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
