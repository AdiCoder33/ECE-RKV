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
  GraduationCap
} from 'lucide-react';
import ResumeBuilder from './ResumeBuilder';
import { useAuth } from '@/contexts/AuthContext';
import ResumeView from './ResumeView';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useParams } from 'react-router-dom';

const StudentProfile = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const { user } = useAuth();
  const id = studentId ?? user?.id;
  const [student, setStudent] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState<Record<string, unknown> | null>(null);
  const [loadingResume, setLoadingResume] = useState(true);
  const apiBase = import.meta.env.VITE_API_URL || '/api';

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

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error || !student) {
    return <div className="text-center text-muted-foreground">{error || 'Student not found'}</div>;
  }

  const currentSubjects = student.currentSubjects || [];
  const semesterRecords = student.semesterRecords || [];
  const attendanceHistory = student.attendanceHistory || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {student.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{student.name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
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
          
          <div className="flex items-center gap-4">
            <Badge className="bg-green-600 text-white">
              GPA: {student.currentGPA}
            </Badge>
            <Badge className={student.attendance >= 75 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
              Attendance: {student.attendance}%
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academics">Academic Records</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          {(user?.role === 'student' || user?.role === 'admin' || user?.role === 'professor' || user?.role === 'hod') && (
            <TabsTrigger value="resume">Resume</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Semester Performance</CardTitle>
                <CardDescription>Subject-wise marks and attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={currentSubjects}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="marks" fill="#8B0000" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GPA Trend</CardTitle>
                <CardDescription>Year and semester-wise academic progress</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={semesterRecords}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="semester"
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Year & Semester', position: 'insideBottomRight', offset: -5 }}
                    />
                    <YAxis domain={[7, 9]} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
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
          <Card>
            <CardHeader>
              <CardTitle>Current Subjects</CardTitle>
              <CardDescription>Detailed performance in all subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentSubjects.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{subject.name}</h4>
                      <p className="text-sm text-muted-foreground">{subject.credits} Credits</p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Marks</p>
                        <p className="text-lg font-bold">{subject.marks}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Attendance</p>
                        <p className="text-lg font-bold">{subject.attendance}%</p>
                      </div>
                      <div className="w-32">
                        <Progress value={subject.marks} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Semester Records</CardTitle>
              <CardDescription>Academic performance across all semesters</CardDescription>
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

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trend</CardTitle>
              <CardDescription>Monthly attendance pattern</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceHistory}>
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
                  <Line type="monotone" dataKey="attendance" stroke="#001F54" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{student.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{student.phone}</span>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-1" />
                  <span>{student.address}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{student.parentContact}</span>
                </div>
                <p className="text-sm text-muted-foreground">Parent/Guardian Contact</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resume" className="space-y-6">
          {user?.role === 'student' ? (
            <ResumeBuilder />
          ) : loadingResume ? (
            <div className="text-center">Loading...</div>
          ) : resume ? (
            <ResumeView resumeData={resume} showDownload={true} />
          ) : (
            <p className="text-center text-muted-foreground">No resume available</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentProfile;