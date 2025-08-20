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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import loaderMp4 from '@/Assets/loader.mp4';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  interface StudentSubject {
    name: string;
    code?: string;
    credits?: number;
    mid1?: number;
    mid2?: number;
    mid3?: number;
    attendance?: number;
  }

  interface RawSubject extends StudentSubject {
    marks?: { mid1?: number; mid2?: number; mid3?: number };
    [key: string]: unknown;
  }

  const [studentSubjects, setStudentSubjects] = useState<StudentSubject[]>([]);
  const [classmates, setClassmates] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('token');

  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [subjectAttendanceData, setSubjectAttendanceData] = useState<
    { name: string; attendance: number }[]
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
          const formatted = (subjects || [])
            .map((s: RawSubject) => ({
              ...s,
              mid1: typeof s.mid1 === 'number' ? s.mid1 : s.marks?.mid1,
              mid2: typeof s.mid2 === 'number' ? s.mid2 : s.marks?.mid2,
              mid3: typeof s.mid3 === 'number' ? s.mid3 : s.marks?.mid3
            }))
            .filter((s: StudentSubject) =>
              [s.mid1, s.mid2, s.mid3].some(
                m => typeof m === 'number' && !isNaN(m as number)
              )
            );
          setStudentSubjects(formatted);

          const subjectData = formatted.map((s: StudentSubject) => ({
            name: s.name,
            attendance: s.attendance ?? 0
          }));
          setSubjectAttendanceData(subjectData);
          const overall =
            subjectData.length > 0
              ? Math.round(
                  subjectData.reduce((sum, s) => sum + s.attendance, 0) /
                    subjectData.length
                )
              : 0;
          setAttendancePercentage(overall);
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

  // Helper for greeting
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  // Helper for gradient backgrounds
  const gradientCard =
    'bg-gradient-to-br from-blue-500 via-indigo-400 to-purple-400 text-white shadow-lg border-0';
  const gradientMetrics = [
    'bg-gradient-to-br from-cyan-500 via-blue-400 to-indigo-400 text-white shadow-md border-0',
    'bg-gradient-to-br from-pink-500 via-red-400 to-orange-400 text-white shadow-md border-0',
    'bg-gradient-to-br from-green-400 via-teal-400 to-blue-400 text-white shadow-md border-0',
    'bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 text-white shadow-md border-0'
  ];

  // Loader (centered, no blur, matches StudentMarks)
  const EceVideoLoader = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent">
      <video
        src={loaderMp4}
        autoPlay
        loop
        muted
        playsInline
        className="w-32 h-32 object-contain mb-4 rounded-lg shadow-lg"
        aria-label="Loading animation"
      />
      <div className="font-semibold text-lg tracking-wide text-[#6366f1]">Loading Dashboard...</div>
      <div className="text-sm mt-1 text-[#2563eb]">Fetching your dashboard data, please wait</div>
    </div>
  );

  // Only render dashboard after loading is false
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 md:px-8" style={{ backgroundColor: '#fbf4ea' }}>
        <EceVideoLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-2 py-2 sm:px-4 md:px-8" style={{ backgroundColor: '#fbf4ea' }}>
      {/* Greeting Card */}
      <div className="flex justify-center mb-4">
        <div
          className={`
            w-full
            max-w-md
            rounded-2xl
            p-5
            flex
            items-center
            gap-4
            ${gradientCard}
            md:max-w-full md:w-full md:rounded-3xl md:p-10
          `}
        >
          <Avatar className="w-14 h-14 border-4 border-white shadow md:w-20 md:h-20">
            <AvatarImage src={user?.profileImage} alt={user?.name} />
            <AvatarFallback
              className="text-lg md:text-2xl font-bold"
              style={{
                backgroundColor: '#fee2e2', // light red-100
                color: '#b91c1c' // red-700 for text
              }}
            >
              {user?.name?.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="hidden md:block">
              <div className="flex flex-col">
                <div className="text-2xl md:text-3xl font-bold">
                  {getGreeting()}, {user?.name || 'Student'}!
                </div>
                <div className="text-base md:text-lg opacity-90 mt-2 italic">
                  "Success is the sum of small efforts, repeated day in and day out."
                </div>
              </div>
            </div>
            <div className="block md:hidden">
              <div className="text-lg font-semibold">{getGreeting()},</div>
              <div className="text-xl font-bold">{user?.name || 'Student'}!</div>
              <div className="text-sm opacity-80 mt-1">Welcome back 👋</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6 mb-2">
        <Card className={gradientMetrics[0]}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Current GPA</CardTitle>
            <Award className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg md:text-2xl font-bold">No data</div>
          </CardContent>
        </Card>
        <Card className={gradientMetrics[1]}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Attendance</CardTitle>
            <Calendar className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg md:text-2xl font-bold">{attendancePercentage}%</div>
            <Progress value={attendancePercentage} className="mt-2 bg-white/30" />
            <p className="text-xs mt-1">
              <span className={attendancePercentage >= 75 ? 'text-green-100' : 'text-red-100'}>
                {attendancePercentage >= 75 ? 'Good' : 'Below min'}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className={gradientMetrics[2]}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Credits</CardTitle>
            <Target className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg md:text-2xl font-bold">{totalCredits}</div>
            <p className="text-xs mt-1">Total credits</p>
          </CardContent>
        </Card>
        <Card className={gradientMetrics[3]}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">My Subjects</CardTitle>
            <BookOpen className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg md:text-2xl font-bold">{studentSubjects.length}</div>
            <p className="text-xs mt-1">This semester</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Today's Schedule */}
        <Card className="rounded-xl shadow border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg flex items-center gap-2 text-[#2563eb]">
              <Calendar className="h-5 w-5 text-[#2563eb]" /> Today's Schedule
            </CardTitle>
            <CardDescription className="text-sm text-[#2563eb]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySchedule.length > 0 ? todaySchedule.map(slot => (
              <div
                key={slot.id}
                className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded"
              >
                <div>
                  <div className="font-medium text-[#2563eb]">{slot.subject}</div>
                  <div className="text-xs text-[#2563eb] flex items-center gap-1">
                    <User className="h-3 w-3" /> {slot.faculty}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-[#2563eb]">{slot.time}</div>
                  <div className="text-xs text-[#2563eb] flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {slot.room}
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-[#2563eb] text-center">No classes today</p>
            )}
          </CardContent>
        </Card>

        {/* My Class */}
        <Card className="rounded-xl shadow border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
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
                  <div key={i} className="h-12 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : classmates.length > 0 ? (
              classmates.slice(0, 4).map((classmate) => (
                <div key={classmate.id} className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 hover:bg-indigo-100/60 transition-colors">
                  <Avatar className="w-8 h-8 border-2 border-blue-200">
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
              <Button variant="ghost" size="sm" className="w-full text-indigo-600">
                View All ({classmates.length})
              </Button>
            )}
          </CardContent>
        </Card>

        {/* My Subjects */}
        <Card className="rounded-xl shadow border-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
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
                  <div key={i} className="h-16 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : studentSubjects.length > 0 ? (
              studentSubjects.slice(0, 3).map((subject, index) => (
                <div key={index} className="p-3 rounded-lg bg-gradient-to-r from-purple-100 via-blue-100 to-indigo-100 hover:bg-indigo-100/60 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm md:text-base text-foreground">{subject.name}</h4>
                      <p className="text-xs text-muted-foreground">{subject.code}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      {subject.credits} Credits
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No subjects assigned</p>
            )}
            {studentSubjects.length > 3 && (
              <Button variant="ghost" size="sm" className="w-full text-blue-600">
                View All ({studentSubjects.length})
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4">
        {/* Subject Performance */}
        <Card className="rounded-xl shadow border-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
          <CardHeader>
            <CardTitle className="text-base md:text-lg text-foreground">Subject Performance</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Internal marks across all subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              {studentSubjects.length > 0 ? (
                <BarChart
                  data={studentSubjects}
                  barGap={2}
                  barCategoryGap={20}
                  margin={{ bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                  <XAxis
                    dataKey="name"
                    stroke="#6366f1"
                    tick={{ angle: -45, textAnchor: 'end', fill: '#6366f1' }}
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} stroke="#6366f1" />
                  <Tooltip
                    contentStyle={{
                      background: 'linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%)',
                      border: '1px solid #6366f1',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="mid1" fill="#60a5fa" barSize={10} radius={[4, 4, 0, 0]} name="Mid 1" />
                  <Bar dataKey="mid2" fill="#f59e42" barSize={10} radius={[4, 4, 0, 0]} name="Mid 2" />
                  <Bar dataKey="mid3" fill="#a78bfa" barSize={10} radius={[4, 4, 0, 0]} name="Mid 3" />
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No performance data available</p>
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject Attendance */}
        <Card className="rounded-xl shadow border-0 bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100">
          <CardHeader>
            <CardTitle className="text-base md:text-lg text-foreground">Subject Attendance</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Attendance percentage per subject
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              {subjectAttendanceData.length > 0 ? (
                <BarChart data={subjectAttendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                  <XAxis dataKey="name" stroke="#6366f1" />
                  <YAxis domain={[0, 100]} stroke="#6366f1" />
                  <Tooltip
                    contentStyle={{
                      background: 'linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%)',
                      border: '1px solid #6366f1',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar
                    dataKey="attendance"
                    fill="#6366f1"
                    barSize={10}
                    radius={[4, 4, 0, 0]}
                    name="Attendance %"
                  />
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No attendance data available</p>
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
