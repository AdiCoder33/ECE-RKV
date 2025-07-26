import React from 'react';
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
  Award,
  BookOpen,
  TrendingUp,
  Clock,
  FileText
} from 'lucide-react';
import ResumeBuilder from './ResumeBuilder';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface StudentProfileProps {
  studentId: string;
}

const StudentProfile = ({ studentId }: StudentProfileProps) => {
  const { user } = useAuth();
  // Mock data - replace with actual API call
  const student = {
    id: studentId,
    name: 'Aarav Patel',
    email: 'aarav.patel@student.edu',
    rollNumber: '20ECE001',
    phone: '+91 9876543210',
    year: 3,
    section: 'A',
    admissionYear: 2020,
    currentGPA: 8.4,
    attendance: 87,
    parentContact: '+91 9876543220',
    address: '123 Main Street, Mumbai, Maharashtra'
  };

  const semesterRecords = [
    { semester: 'Sem 1', sgpa: 8.2, cgpa: 8.2 },
    { semester: 'Sem 2', sgpa: 8.0, cgpa: 8.1 },
    { semester: 'Sem 3', sgpa: 8.5, cgpa: 8.2 },
    { semester: 'Sem 4', sgpa: 8.3, cgpa: 8.25 },
    { semester: 'Sem 5', sgpa: 8.6, cgpa: 8.4 }
  ];

  const currentSubjects = [
    { name: 'Digital Signal Processing', marks: 92, attendance: 95, credits: 4 },
    { name: 'VLSI Design', marks: 88, attendance: 82, credits: 3 },
    { name: 'Computer Networks', marks: 90, attendance: 91, credits: 4 },
    { name: 'Microprocessors', marks: 85, attendance: 89, credits: 3 },
    { name: 'Control Systems', marks: 87, attendance: 85, credits: 4 }
  ];

  const attendanceHistory = [
    { month: 'Aug', attendance: 92 },
    { month: 'Sep', attendance: 88 },
    { month: 'Oct', attendance: 85 },
    { month: 'Nov', attendance: 89 },
    { month: 'Dec', attendance: 87 }
  ];

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
              {student.rollNumber} • ECE {student.year}{student.year === 1 ? 'st' : student.year === 2 ? 'nd' : student.year === 3 ? 'rd' : 'th'} Year, Section {student.section}
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
                <CardDescription>Semester-wise academic progress</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={semesterRecords}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="semester" stroke="hsl(var(--muted-foreground))" />
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
                      <th className="text-left p-3">Semester</th>
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
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Student Resume
                </CardTitle>
                <CardDescription>View {student.name}'s resume and career profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Student resume will be displayed here</p>
                  <p className="text-sm mt-2">Resume data will be fetched from the student's profile</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentProfile;