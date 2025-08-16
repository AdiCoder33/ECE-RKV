
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BookOpen,
  Calendar,
  Award,
  Target,
  Users,
  MapPin,
  User
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [studentSubjects, setStudentSubjects] = useState([]);
  const [classmates, setClassmates] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('token');

  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [attendanceData, setAttendanceData] = useState<
    { month: string; attendance: number }[]
  >([]);
  const [todaySchedule, setTodaySchedule] = useState([]);

  const totalCredits = useMemo(
    () => studentSubjects.reduce((sum, s) => sum + (s.credits || 0), 0),
    [studentSubjects]
  );

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        if (typeof user?.id !== 'number') {
          toast({ variant: 'destructive', title: 'Invalid user ID' });
          return;
        }

        // Fetch student's subjects
        const subjectsResponse = await fetch(
          `${apiBase}/students/${String(user.id)}/subjects`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (subjectsResponse.ok) {
          const subjects = await subjectsResponse.json();
          setStudentSubjects(subjects);
        }

        // Fetch classmates
        const classmatesResponse = await fetch(
          `${apiBase}/students/classmates?year=${user.year}&semester=${user.semester}&section=${user.section}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (classmatesResponse.ok) {
          const classmatesData = await classmatesResponse.json();
          setClassmates(classmatesData.filter(student => student.id !== user.id));
        }

        // Fetch attendance data
        const attendanceResponse = await fetch(
          `${apiBase}/attendance?studentId=${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (!attendanceResponse.ok) {
          const data = await attendanceResponse.json().catch(() => ({}));
          toast({
            title: 'Error',
            description: data.message || 'Failed to load attendance',
            variant: 'destructive'
          });
        } else {
          const records = await attendanceResponse.json();
          const total = records.length;
          let attended = 0;
          const monthMap: Record<string, { attended: number; total: number }> = {};
          records.forEach((rec: { date: string; present: number | boolean }) => {
            const isPresent = rec.present === true || rec.present === 1;
            const month = new Date(rec.date).toLocaleString('default', {
              month: 'short'
            });
            if (!monthMap[month]) monthMap[month] = { attended: 0, total: 0 };
            monthMap[month].total += 1;
            if (isPresent) {
              attended += 1;
              monthMap[month].attended += 1;
            }
          });
          const overall = total > 0 ? Math.round((attended / total) * 100) : 0;
          setAttendancePercentage(overall);
          const trend = Object.entries(monthMap).map(([month, m]) => ({
            month,
            attendance: m.total > 0 ? Math.round((m.attended / m.total) * 100) : 0
          }));
          setAttendanceData(trend);
        }

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const scheduleRes = await fetch(
          `${apiBase}/timetable?year=${user.year}&semester=${user.semester}&section=${user.section}&day=${today}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (scheduleRes.ok) {
          setTodaySchedule(await scheduleRes.json());
        } else {
          toast({ title: 'Error', description: 'Failed to load schedule', variant: 'destructive' });
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user?.id, user?.year, user?.semester, user?.section, apiBase, token, toast]);
  return (
    <div className="space-y-4 md:space-y-6 px-4 py-2 sm:px-6 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground mt-1 md:mt-2">Track your academic progress and performance</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/student-attendance')}>
            <Calendar className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">View Attendance</span>
            <span className="sm:hidden">Attendance</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/profile')}>
            <Award className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">My Profile</span>
            <span className="sm:hidden">Profile</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Current GPA</CardTitle>
            <Award className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg md:text-2xl font-bold text-foreground">No data available</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Attendance</CardTitle>
            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg md:text-2xl font-bold text-foreground">{attendancePercentage}%</div>
            <Progress value={attendancePercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <span className={attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'}>
                {attendancePercentage >= 75 ? 'Good' : 'Below min'}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Credits</CardTitle>
            <Target className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg md:text-2xl font-bold text-foreground">{totalCredits}</div>
            <p className="text-xs text-muted-foreground mt-1">Total credits this semester</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">My Subjects</CardTitle>
            <BookOpen className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg md:text-2xl font-bold text-foreground">{studentSubjects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This semester
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* My Subjects */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Subjects
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Current semester subjects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : studentSubjects.length > 0 ? (
              studentSubjects.slice(0, 3).map((subject, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm md:text-base text-foreground">{subject.name}</h4>
                      <p className="text-xs text-muted-foreground">{subject.code}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {subject.credits} Credits
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No subjects assigned</p>
            )}
            {studentSubjects.length > 3 && (
              <Button variant="ghost" size="sm" className="w-full">
                View All ({studentSubjects.length})
              </Button>
            )}
          </CardContent>
        </Card>

        {/* My Class */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Class
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              {user?.year} Year - Sem {user?.semester} - Section {user?.section}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : classmates.length > 0 ? (
              classmates.slice(0, 4).map((classmate) => (
                <div key={classmate.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={classmate.profileImage} alt={classmate.name} />
                    <AvatarFallback className="text-xs">
                      {classmate.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{classmate.name}</p>
                    <p className="text-xs text-muted-foreground">Roll: {classmate.rollNumber}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No classmates found</p>
            )}
            {classmates.length > 4 && (
              <Button variant="ghost" size="sm" className="w-full">
                View All ({classmates.length})
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Today's Schedule
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySchedule.length > 0 ? todaySchedule.map(slot => (
              <div key={slot.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div>
                  <div className="font-medium">{slot.subject}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> {slot.faculty}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{slot.time}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {slot.room}
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center">No classes today</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Subject Performance */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base md:text-lg text-foreground">Subject Performance</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Internal marks across all subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              {studentSubjects.length > 0 && studentSubjects.some(s => s.marks && !isNaN(s.marks)) ? (
                <BarChart data={studentSubjects.filter(s => s.marks && !isNaN(s.marks))} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" width={80} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="marks" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No performance data available</p>
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Trend */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base md:text-lg text-foreground">Attendance Trend</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Monthly attendance percentage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceData}>
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
                  dataKey="attendance" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default StudentDashboard;
