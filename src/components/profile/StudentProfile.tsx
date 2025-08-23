import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  ArrowLeft
} from 'lucide-react';
import ResumeBuilder from './ResumeBuilder';
import { useAuth } from '@/contexts/AuthContext';
import ResumeView from './ResumeView';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useParams, useNavigate } from 'react-router-dom';
import loaderMp4 from '@/Assets/loader.mp4';

// ECE theme colors
const THEME = {
  bgBeige: '#fbf4ea',
  accent: '#8b0000',
  cardBg: 'bg-white',
  cardShadow: 'shadow-lg',
  textMuted: 'text-gray-600'
};

// Loader component using loader.mp4
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
    <div className="font-semibold text-lg tracking-wide text-[#8b0000]">Loading Profile...</div>
    <div className="text-sm mt-1 text-[#a52a2a]">Fetching student data, please wait</div>
  </div>
);

const StudentProfile = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const { user } = useAuth();
  const id = studentId ?? user?.id;
  const [student, setStudent] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState<Record<string, any> | null>(null);
  const [loadingResume, setLoadingResume] = useState(true);
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudent = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiBase}/students/${id}/details`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) {
          if (res.status === 404) {
            setStudent(null);
            setError('Student not found');
          } else {
            throw new Error('Failed to fetch student');
          }
        } else {
          const data = await res.json();
          setStudent({
            ...data,
            currentGPA: data.currentGPA ?? data.cgpa ?? 0,
            attendance: data.attendance ?? data.attendancePercentage ?? 0,
            currentSubjects: data.currentSubjects ?? [],
            semesterRecords: data.semesterRecords ?? [],
            attendanceHistory: data.attendanceHistory ?? [],
          });
        }
      } catch (err) {
        setError((err as Error).message);
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id, apiBase]);

  useEffect(() => {
    const fetchResume = async () => {
      if (!id) return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiBase}/resumes/${id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data: Record<string, unknown> = await res.json();
          setResume(data);
        } else {
          setResume(null);
        }
      } catch {
        setResume(null);
      } finally {
        setLoadingResume(false);
      }
    };
    fetchResume();
  }, [id, apiBase]);

  // Responsive tab style using Radix UI data-state for active tab
  const tabTriggerClasses =
    "flex-shrink-0 min-w-[105px] px-2 py-2 sm:px-4 sm:py-2 text-xs sm:text-base font-semibold rounded transition-all " +
    "bg-white text-[#8b0000] hover:bg-[#f3f3f3] border-b-4 border-transparent " +
    "data-[state=active]:bg-[#fde8e6] data-[state=active]:text-[#8b0000] data-[state=active]:border-b-4 data-[state=active]:border-[#8b0000]";

  if (loading) {
    return (
      <div className="min-h-screen w-full px-0 sm:px-0 py-0" style={{ background: THEME.bgBeige }}>
        <Loader />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: THEME.bgBeige }}>
        <div className="text-center text-[#8b0000] text-lg">{error || 'Student not found'}</div>
      </div>
    );
  }

  const currentSubjects = student.currentSubjects || [];
  const semesterRecords = student.semesterRecords || [];
  const attendanceHistory = student.attendanceHistory || [];

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{ background: THEME.bgBeige }}
    >
      <div className="w-full max-w-5xl space-y-6 px-1 sm:px-2 md:px-4 py-3 sm:py-6 md:px-8">
        {/* Back Button */}
        <div className="mb-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1 rounded-md border border-[#8b0000] text-[#8b0000] bg-white hover:bg-[#fde8e6] font-semibold transition"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <Avatar className="h-16 w-16 sm:h-24 sm:w-24">
            <AvatarFallback className="bg-[#8b0000] text-white text-xl sm:text-2xl">
              {student.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-lg sm:text-3xl font-bold text-[#8b0000] break-words">{student.name}</h1>
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4 text-gray-600 text-xs sm:text-base">
              <div className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                {student.rollNumber} • ECE {student.year}
                {student.year === 1 ? 'st' : student.year === 2 ? 'nd' : student.year === 3 ? 'rd' : 'th'} Year, Section {student.section}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Batch {student.admissionYear}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <Badge className="bg-green-600 text-white text-xs sm:text-base">
                GPA: {student.currentGPA}
              </Badge>
              <Badge className={`${student.attendance >= 75 ? 'bg-green-600' : 'bg-red-600'} text-white text-xs sm:text-base`}>
                Attendance: {student.attendance}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Responsive Tabs with smooth sliding animation */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex w-full bg-[#fff6e6] rounded-lg shadow mb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-[#b86b2e]/60 scrollbar-track-[#fde8e6]/40">
            <TabsTrigger value="overview" className={tabTriggerClasses}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="academics" className={tabTriggerClasses}>
              Academic Records
            </TabsTrigger>
            <TabsTrigger value="attendance" className={tabTriggerClasses}>
              Attendance
            </TabsTrigger>
            <TabsTrigger value="contact" className={tabTriggerClasses}>
              Contact Info
            </TabsTrigger>
            {(user?.role === 'student' || user?.role === 'admin' || user?.role === 'professor' || user?.role === 'hod') && (
              <TabsTrigger value="resume" className={tabTriggerClasses}>
                Resume
              </TabsTrigger>
            )}
          </TabsList>

          {/* Animated tab content for smooth sliding */}
          <div className="relative min-h-[400px]">
            <TabsContent
              value="overview"
              className="absolute inset-0 w-full transition-all duration-300 data-[state=active]:opacity-100 data-[state=active]:translate-x-0 data-[state=inactive]:opacity-0 data-[state=inactive]:-translate-x-8 z-10"
            >
              {/* Current Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card className={`${THEME.cardBg} ${THEME.cardShadow}`}>
                  <CardHeader>
                    <CardTitle className="text-[#8b0000]">Current Semester Performance</CardTitle>
                    <CardDescription className={THEME.textMuted}>Subject-wise marks and attendance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={currentSubjects}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} stroke="#8b0000" />
                        <YAxis stroke="#8b0000" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #8b0000',
                            borderRadius: '6px'
                          }}
                        />
                        <Bar dataKey="marks" fill="#8B0000" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className={`${THEME.cardBg} ${THEME.cardShadow}`}>
                  <CardHeader>
                    <CardTitle className="text-[#8b0000]">GPA Trend</CardTitle>
                    <CardDescription className={THEME.textMuted}>Year and semester-wise academic progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={semesterRecords}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="semester"
                          stroke="#8b0000"
                          label={{ value: 'Year & Semester', position: 'insideBottomRight', offset: -5 }}
                        />
                        <YAxis domain={[7, 9]} stroke="#8b0000" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #8b0000',
                            borderRadius: '6px'
                          }}
                        />
                        <Line type="monotone" dataKey="cgpa" stroke="#001F54" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Subject Details */}
              <Card className={`${THEME.cardBg} ${THEME.cardShadow}`}>
                <CardHeader>
                  <CardTitle className="text-[#8b0000]">Current Subjects</CardTitle>
                  <CardDescription className={THEME.textMuted}>Detailed performance in all subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentSubjects.map((subject, index) => (
                      <div key={index} className="flex flex-col md:flex-row items-center justify-between p-4 border rounded-lg gap-4">
                        <div className="space-y-1 w-full md:w-auto">
                          <h4 className="font-medium">{subject.name}</h4>
                          <p className="text-sm text-gray-600">{subject.credits} Credits</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Marks</p>
                            <p className="text-lg font-bold">{subject.marks}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Attendance</p>
                            <p className="text-lg font-bold">{subject.attendance}%</p>
                          </div>
                          <div className="w-full md:w-32">
                            <Progress value={subject.marks} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent
              value="academics"
              className="absolute inset-0 w-full transition-all duration-300 data-[state=active]:opacity-100 data-[state=active]:translate-x-0 data-[state=inactive]:opacity-0 data-[state=inactive]:translate-x-8 z-10"
            >
              <Card className={`${THEME.cardBg} ${THEME.cardShadow}`}>
                <CardHeader>
                  <CardTitle className="text-[#8b0000]">Semester Records</CardTitle>
                  <CardDescription className={THEME.textMuted}>Academic performance across all semesters</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Year & Semester</th>
                          <th className="text-left p-3">SGPA</th>
                          <th className="text-left p-3">CGPA</th>
                          <th className="text-left p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {semesterRecords.map((record, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-3 font-medium">{record.semester}</td>
                            <td className="p-3">{record.sgpa}</td>
                            <td className="p-3">{record.cgpa}</td>
                            <td className="p-3">
                              <Badge className="bg-green-600 text-white">Passed</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent
              value="attendance"
              className="absolute inset-0 w-full transition-all duration-300 data-[state=active]:opacity-100 data-[state=active]:translate-x-0 data-[state=inactive]:opacity-0 data-[state=inactive]:-translate-x-8 z-10"
            >
              <Card className={`${THEME.cardBg} ${THEME.cardShadow}`}>
                <CardHeader>
                  <CardTitle className="text-[#8b0000]">Attendance Trend</CardTitle>
                  <CardDescription className={THEME.textMuted}>Monthly attendance pattern</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={attendanceHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#8b0000" />
                      <YAxis domain={[70, 100]} stroke="#8b0000" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #8b0000',
                          borderRadius: '6px'
                        }}
                      />
                      <Line type="monotone" dataKey="attendance" stroke="#001F54" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent
              value="contact"
              className="absolute inset-0 w-full transition-all duration-300 data-[state=active]:opacity-100 data-[state=active]:translate-x-0 data-[state=inactive]:opacity-0 data-[state=inactive]:translate-x-8 z-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card className={`${THEME.cardBg} ${THEME.cardShadow}`}>
                  <CardHeader>
                    <CardTitle className="text-[#8b0000]">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span>{student.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <span>{student.phone}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-gray-600 mt-1" />
                      <span>{student.address}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`${THEME.cardBg} ${THEME.cardShadow}`}>
                  <CardHeader>
                    <CardTitle className="text-[#8b0000]">Emergency Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <span>{student.parentContact}</span>
                    </div>
                    <p className="text-sm text-gray-600">Parent/Guardian Contact</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            {(user?.role === 'student' || user?.role === 'admin' || user?.role === 'professor' || user?.role === 'hod') && (
              <TabsContent
                value="resume"
                className="absolute inset-0 w-full transition-all duration-300 data-[state=active]:opacity-100 data-[state=active]:translate-x-0 data-[state=inactive]:opacity-0 data-[state=inactive]:-translate-x-8 z-10"
              >
                {user?.role === 'student' ? (
                  <ResumeBuilder />
                ) : loadingResume ? (
                  <Loader />
                ) : resume ? (
                  <ResumeView resumeData={resume} showDownload={true} />
                ) : (
                  <p className="text-center text-[#8b0000]">No resume available</p>
                )}
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentProfile;