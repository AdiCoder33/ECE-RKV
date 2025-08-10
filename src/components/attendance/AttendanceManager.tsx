
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel';
import { 
  Calendar, 
  Users, 
  Search, 
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Save
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMediaQuery } from 'usehooks-ts';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

interface AttendanceStudent {
  id: string;
  name: string;
  rollNumber: number;
  collegeId: string;
  present: boolean;
  attendancePercentage: number;
}

const apiBase = import.meta.env.VITE_API_URL || '/api';

const AttendanceManager = () => {
  const { user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSubject = searchParams.get('subject') || '';
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState('1');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState('1');
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [searchTerm, setSearchTerm] = useState('');
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const isDesktop = useMediaQuery('(min-width:768px)');
  const itemsPerPage = isDesktop ? 15 : 9;

  // Check if user has access based on role
  const hasFullAccess = user?.role === 'admin' || user?.role === 'hod';
  const isProfessor = user?.role === 'professor';

  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [classId, setClassId] = useState<string | null>(null);

  // Filter years and sections based on professor's assigned classes
  const getAllowedYears = () => hasFullAccess ? ['1', '2', '3', '4'] : ['3', '4']; // Professor demo: years 3-4
  const getAllowedSections = () => hasFullAccess ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B']; // Professor demo: sections A-B

  const years = getAllowedYears();
  const sections = getAllowedSections();
  const periods = [
    { value: '1', label: 'Period 1 (9:00 AM - 10:00 AM)' },
    { value: '2', label: 'Period 2 (10:00 AM - 11:00 AM)' },
    { value: '3', label: 'Period 3 (11:00 AM - 12:00 PM)' },
    { value: '4', label: 'Period 4 (2:00 PM - 3:00 PM)' },
    { value: '5', label: 'Period 5 (3:00 PM - 4:00 PM)' },
    { value: '6', label: 'Period 6 (4:00 PM - 5:00 PM)' }
  ];

  const getCurrentSemester = () => {
    const month = new Date().getMonth() + 1;
    return month >= 6 && month <= 11 ? '1' : '2';
  };
  const currentSemester = getCurrentSemester();

  React.useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${apiBase}/subjects?year=${selectedYear}&semester=${currentSemester}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error('Failed to fetch subjects');
        }
        const data: { id: string; name: string }[] = await response.json();
        setSubjects(data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };

    fetchSubjects();
  }, [selectedYear, currentSemester]);

  React.useEffect(() => {
    if (subjects.length > 0 && selectedSubject && isNaN(Number(selectedSubject))) {
      const match = subjects.find(s => s.name === selectedSubject);
      setSelectedSubject(match ? match.id : '');
    }
  }, [subjects, selectedSubject]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch class ID based on selected year and section
        const classRes = await fetch(`${apiBase}/classes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!classRes.ok) {
          throw new Error('Failed to fetch classes');
        }
        type ClassResponse = { id: string; year: number; section: string };
        const classes: ClassResponse[] = await classRes.json();
        const cls = classes.find(
          (c) => c.year.toString() === selectedYear && c.section === selectedSection
        );
        const cid = cls?.id || null;
        setClassId(cid);

        // Fetch students for the selected class
        const response = await fetch(
          `${apiBase}/students?year=${selectedYear}&section=${selectedSection}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }
        type StudentResponse = {
          id: string;
          name: string;
          rollNumber: number;
          collegeId: string;
          attendancePercentage: number;
        };
        const data: StudentResponse[] = await response.json();
        const mapped: AttendanceStudent[] = data.map((s) => ({
          id: s.id,
          name: s.name,
          rollNumber: s.rollNumber,
          collegeId: s.collegeId,
          attendancePercentage: s.attendancePercentage,
          present: false,
        }));
        setStudents(mapped);

        // Fetch attendance summary to update percentages
        if (cid && selectedSubject) {
          const summaryRes = await fetch(
            `${apiBase}/attendance/summary?classId=${cid}&subjectId=${selectedSubject}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (summaryRes.ok) {
            type SummaryResponse = {
              studentId: string;
              attendancePercentage: number;
            };
            const summary: SummaryResponse[] = await summaryRes.json();
            setStudents((prev) =>
              prev.map((student) => {
                const rec = summary.find((s) => s.studentId === student.id);
                return rec
                  ? { ...student, attendancePercentage: Math.round(rec.attendancePercentage) }
                  : student;
              })
            );
          }
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchData();
  }, [selectedYear, selectedSection, selectedSubject]);

  const fetchAttendance = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${apiBase}/attendance?year=${selectedYear}&section=${selectedSection}&date=${selectedDate}`;
      if (selectedSubject) {
        url += `&subjectId=${selectedSubject}`;
      }
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }
      type AttendanceRecord = {
        studentId: string;
        present: boolean | number;
        period: string | number;
      };
      const data: AttendanceRecord[] = await response.json();
      const periodRecords = data.filter(r => r.period?.toString() === selectedPeriod);
      setStudents(prev =>
        prev.map(student => {
          const record = periodRecords.find(r => r.studentId === student.id);
          return record
            ? { ...student, present: Boolean(record.present) }
            : { ...student, present: false };
        })
      );
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  }, [selectedDate, selectedPeriod, selectedYear, selectedSection, selectedSubject]);

  React.useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const toggleAttendance = (studentId: string) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, present: !student.present }
        : student
    ));
  };

  const markAllPresent = () => {
    setStudents(prev => prev.map(student => ({ ...student, present: true })));
  };

  const markAllAbsent = () => {
    setStudents(prev => prev.map(student => ({ ...student, present: false })));
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.collegeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toString().includes(searchTerm)
  );

  const studentChunks = React.useMemo(() => {
    const chunks: AttendanceStudent[][] = [];
    for (let i = 0; i < filteredStudents.length; i += itemsPerPage) {
      chunks.push(filteredStudents.slice(i, i + itemsPerPage));
    }
    return chunks;
  }, [filteredStudents, itemsPerPage]);

  React.useEffect(() => {
    api?.scrollTo(0);
  }, [api, filteredStudents, itemsPerPage]);

  const presentCount = students.filter(s => s.present).length;
  const absentCount = students.length - presentCount;
  const attendanceRate =
    students.length > 0
      ? Math.round(
          students.reduce((sum, s) => sum + s.attendancePercentage, 0) /
            students.length
        )
      : 0;

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceBadge = (percentage: number) => {
    if (percentage >= 85) return { variant: 'default' as const, label: 'Good' };
    if (percentage >= 75) return { variant: 'secondary' as const, label: 'Warning' };
    return { variant: 'destructive' as const, label: 'Critical' };
  };

  React.useEffect(() => {
    const autofillSubject = async () => {
      if (selectedSubject) return;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${apiBase}/timetable?year=${selectedYear}&semester=${currentSemester}&section=${selectedSection}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) return;
        type TimetableSlot = { day: string; time: string; subject: string };
        const data: TimetableSlot[] = await response.json();
        const day = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
        const periodTimes: Record<string, string> = {
          '1': '09:00-10:00',
          '2': '10:00-11:00',
          '3': '11:00-12:00',
          '4': '14:00-15:00',
          '5': '15:00-16:00',
          '6': '16:00-17:00'
        };
        const slot = data.find((s) => s.day === day && s.time === periodTimes[selectedPeriod]);
        if (slot) {
          const matched = subjects.find(sub => sub.name === slot.subject);
          if (matched) setSelectedSubject(matched.id);
        }
      } catch (error) {
        console.error('Error auto-filling subject:', error);
      }
    };

    autofillSubject();
  }, [selectedDate, selectedPeriod, selectedYear, selectedSection, subjects, selectedSubject, currentSemester]);

  const handleSaveAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const attendanceData = students.map(s => ({ studentId: s.id, present: s.present }));
      const response = await fetch(`${apiBase}/attendance/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectId: selectedSubject,
          date: selectedDate,
          period: selectedPeriod,
          attendanceData,
          markedBy: user?.id,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }
      toast({
        title: 'Attendance Saved',
        description: 'Attendance has been saved successfully',
      });
      await fetchAttendance();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save attendance',
      });
    }
  };

  return (
    <div className="space-y-6 bg-background text-foreground px-4 sm:px-6 md:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
          <p className="text-muted-foreground">Mark and track student attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Class and Date Selection */}
      <Card>
        <CardContent className="p-6">
          {isProfessor && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Professor Access:</strong> You can only mark attendance for your assigned classes and subjects.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year-select">Year</Label>
              <select 
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-2 border rounded-md bg-background text-foreground"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}st Year</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="section-select">Section</Label>
              <select 
                id="section-select"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full p-2 border rounded-md bg-background text-foreground"
              >
                {sections.map(section => (
                  <option key={section} value={section}>Section {section}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-select">Date</Label>
              <Input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period-select">Period</Label>
              <select
                id="period-select"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full p-2 border rounded-md bg-background text-foreground"
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject-select">Subject</Label>
              <select
                id="subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 border rounded-md bg-background text-foreground"
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button className="w-full">
                Load Class
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">{attendanceRate}%</p>
                <Progress value={attendanceRate} className="mt-2 h-2" />
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Attendance Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Student Attendance - Year {selectedYear}, Section {selectedSection}
              </CardTitle>
              <CardDescription>
                {selectedDate} • {periods.find(p => p.value === selectedPeriod)?.label}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllPresent}>
                Mark All Present
              </Button>
              <Button variant="outline" size="sm" onClick={markAllAbsent}>
                Mark All Absent
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Carousel setApi={setApi}>
            <CarouselContent>
              {studentChunks.map((chunk, index) => (
                <CarouselItem key={index}>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    {chunk.map((student) => {
                      const attendanceBadge = getAttendanceBadge(student.attendancePercentage);
                      return (
                        <Card
                          key={student.id}
                          className={`p-4 border-2 transition-all cursor-pointer ${
                            student.present ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                          }`}
                          onClick={() => toggleAttendance(student.id)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <Checkbox
                              checked={student.present}
                              onCheckedChange={() => toggleAttendance(student.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className={`w-3 h-3 rounded-full ${student.present ? 'bg-green-500' : 'bg-red-500'}`} />
                          </div>

                          <div className="text-center space-y-2">
                            {/* Large Roll Number */}
                            <div className="text-4xl font-bold text-primary">
                              {student.rollNumber}
                            </div>

                            {/* Student Name */}
                            <p className="font-medium text-sm text-foreground">{student.name}</p>

                            {/* College ID */}
                            <p className="text-xs text-muted-foreground font-mono">{student.collegeId}</p>

                            {/* Attendance Percentage and Badge */}
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-xs font-medium ${getAttendanceColor(student.attendancePercentage)}`}>
                                {student.attendancePercentage}%
                              </span>
                              <Badge variant={attendanceBadge.variant} className="hidden md:inline-flex text-xs">
                                {attendanceBadge.label}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={handleSaveAttendance}>
          <Save className="h-4 w-4 mr-2" />
          Save Attendance
        </Button>
      </div>
    </div>
  );
};

export default AttendanceManager;
