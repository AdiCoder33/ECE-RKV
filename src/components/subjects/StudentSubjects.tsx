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
  const [subjects, setSubjects] = useState<StudentSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        if (!user?.id) return;
        
        const response = await fetch(`/api/students/${user.id}/subjects`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSubjects(data);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [user]);

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
      <div className="space-y-6 p-4 md:p-0">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Subjects</h1>
          <p className="text-muted-foreground">
            Current semester subjects for {user?.year} Year - Section {user?.section}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Academic Year 2024-25 | Semester {Math.ceil((new Date().getMonth() + 1) / 6)}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Subjects</p>
                <p className="text-2xl font-bold text-foreground">{subjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Marks</p>
                <p className="text-2xl font-bold text-foreground">
                  {subjects.length > 0 ? Math.round(subjects.reduce((acc, s) => acc + s.marks, 0) / subjects.length) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
                <p className="text-2xl font-bold text-foreground">
                  {subjects.length > 0 ? Math.round(subjects.reduce((acc, s) => acc + s.attendance, 0) / subjects.length) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-2xl font-bold text-foreground">
                  {subjects.reduce((acc, s) => acc + s.credits, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects List */}
      <div className="space-y-4">
        {subjects.length > 0 ? (
          subjects.map((subject) => (
            <Card key={subject.id} className="border-border hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg md:text-xl text-foreground">{subject.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{subject.code}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {subject.credits} Credits
                    </Badge>
                    <Badge variant={subject.type === 'theory' ? 'outline' : 'default'}>
                      {subject.type.charAt(0).toUpperCase() + subject.type.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Marks */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-muted-foreground">Internal Marks</h4>
                      <span className={`text-sm font-bold ${getMarksColor(subject.marks)}`}>
                        {subject.marks}/100
                      </span>
                    </div>
                    <Progress value={subject.marks} className="h-2" />
                  </div>

                  {/* Attendance */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-muted-foreground">Attendance</h4>
                      <span className={`text-sm font-bold ${getAttendanceColor(subject.attendance)}`}>
                        {subject.attendance}%
                      </span>
                    </div>
                    <Progress value={subject.attendance} className="h-2" />
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
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">No Subjects Assigned</h3>
              <p className="text-muted-foreground">
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
