import React from 'react';
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
  Save,
  RotateCcw,
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
  present: boolean | null;
  attendancePercentage: number;
}

interface TimetableSlot {
  day: string;
  time: string;
  subject: string;
  year?: number;
  semester?: number;
  section?: string;
  subject_id?: string;
  faculty_id?: number | null;
}

interface PeriodOption {
  value: string;
  label: string;
  subjectId: string;
  year: string;
  semester: string;
  section: string;
}

const apiBase = import.meta.env.VITE_API_URL || '/api';

const TIME_TO_PERIOD: Record<string, string> = {
  '09:00-10:00': '1',
  '10:00-11:00': '2',
  '11:00-12:00': '3',
  '14:00-15:00': '4',
  '15:00-16:00': '5',
  '16:00-17:00': '6',
};

const AttendanceManager: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSubject = searchParams.get('subjectId') || '';
  const initialYear = searchParams.get('year') || '1';
  const initialSection = searchParams.get('section') || 'A';
  const initialTime = searchParams.get('time') || '';
  const initialPeriod = TIME_TO_PERIOD[initialTime] || '';
  const { toast } = useToast();

  const [selectedYear, setSelectedYear] = React.useState(initialYear);
  const [selectedSection, setSelectedSection] = React.useState(initialSection);
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = React.useState(initialPeriod);
  const [subjects, setSubjects] = React.useState<{ id: string; name: string }[]>([]);
  const [selectedSubject, setSelectedSubject] = React.useState(initialSubject);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [timetable, setTimetable] = React.useState<TimetableSlot[]>([]);
  const [slotOptions, setSlotOptions] = React.useState<PeriodOption[]>([]);
  const [periodOptions, setPeriodOptions] = React.useState<PeriodOption[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState('');

  const isDesktop = useMediaQuery('(min-width:768px)');
  const itemsPerPage = isDesktop ? 15 : 9;

  // Access control
  const hasFullAccess = user?.role === 'admin' || user?.role === 'hod';
  const isProfessor = user?.role === 'professor';

  const [students, setStudents] = React.useState<AttendanceStudent[]>([]);
  const [classId, setClassId] = React.useState<string | null>(null);

  // Filter years and sections based on professor's assigned classes (demo constraints)
  const getAllowedYears = () => (hasFullAccess ? ['1', '2', '3', '4'] : ['3', '4']);
  const getAllowedSections = () => (hasFullAccess ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B']);

  const years = getAllowedYears();
  const sections = getAllowedSections();

  const getCurrentSemester = () => {
    const month = new Date().getMonth() + 1;
    return month >= 6 && month <= 11 ? '1' : '2';
  };
  const currentSemester = getCurrentSemester();

  // Fetch subjects for selected year/semester
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
        if (!response.ok) throw new Error('Failed to fetch subjects');
        const data: { id: string; name: string }[] = await response.json();
        setSubjects(data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };
    fetchSubjects();
  }, [selectedYear, currentSemester]);

  // If the URL provided a subject name, convert it to its ID once subjects arrive
  React.useEffect(() => {
    if (subjects.length > 0 && selectedSubject && isNaN(Number(selectedSubject))) {
      const match = subjects.find((s) => s.name === selectedSubject);
      setSelectedSubject(match ? match.id : '');
    }
  }, [subjects, selectedSubject]);

  // Fetch timetable for the selected class (non-professors)
  React.useEffect(() => {
    if (isProfessor) return;
    const fetchTimetable = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${apiBase}/timetable?year=${selectedYear}&semester=${currentSemester}&section=${selectedSection}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error('Failed to fetch timetable');
        const data: TimetableSlot[] = await response.json();
        setTimetable(data);
      } catch (error) {
        console.error('Error fetching timetable:', error);
      }
    };
    fetchTimetable();
  }, [selectedYear, selectedSection, currentSemester, isProfessor]);

  // Fetch timetable for professors based on selected date
  React.useEffect(() => {
    if (!isProfessor || !user?.id) return;
    const fetchProfessorTimetable = async () => {
      try {
        const token = localStorage.getItem('token');
        const weekday = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
        const response = await fetch(
          `${apiBase}/timetable?facultyId=${user.id}&day=${weekday}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error('Failed to fetch timetable');
        const data: TimetableSlot[] = await response.json();
        setTimetable(data);
      } catch (error) {
        console.error('Error fetching timetable:', error);
      }
    };
    fetchProfessorTimetable();
  }, [isProfessor, user?.id, selectedDate]);

  // Build period options based on timetable and date
  React.useEffect(() => {
    const day = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
    const daySlots = timetable.filter((slot) => slot.day === day);
    const options: PeriodOption[] = daySlots
      .map((slot) => {
        const periodNumber = TIME_TO_PERIOD[slot.time];
        const subjectId = slot.subject_id
          ? String(slot.subject_id)
          : subjects.find((s) => s.name === slot.subject)?.id;
        if (!periodNumber || !subjectId) return null;
        return {
          value: periodNumber,
          label: `${slot.time} – ${slot.subject}`,
          subjectId,
          year: String(slot.year ?? selectedYear),
          semester: String(slot.semester ?? currentSemester),
          section: slot.section ?? selectedSection,
        };
      })
      .filter((opt): opt is PeriodOption => opt !== null);
    setSlotOptions(options);
    if (!isProfessor) {
      setPeriodOptions(options);
    }
  }, [timetable, selectedDate, subjects, selectedYear, selectedSection, currentSemester, isProfessor]);

  // Reset slot and period selections when date changes for professors
  React.useEffect(() => {
    if (isProfessor) {
      setSelectedSlot('');
      setSelectedPeriod('');
      setPeriodOptions([]);
    }
  }, [selectedDate, isProfessor]);

  // Fetch attendance for the current selection
  const fetchAttendance = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${apiBase}/attendance?year=${selectedYear}&section=${selectedSection}&date=${selectedDate}`;
      if (selectedSubject) url += `&subjectId=${selectedSubject}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch attendance');

      type AttendanceRecord = {
        studentId: string | number;
        present: boolean | number;
        period: string | number;
      };

      const data: AttendanceRecord[] = await response.json();
      const periodRecords = data.filter((r) => r.period?.toString() === selectedPeriod);

      setStudents((prev) =>
        prev.map((student) => {
          const record = periodRecords.find((r) => String(r.studentId) === String(student.id));
          return record ? { ...student, present: Boolean(record.present) } : { ...student, present: null };
        })
      );
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  }, [selectedDate, selectedPeriod, selectedYear, selectedSection, selectedSubject]);

  // Fetch class + students whenever the selection changes, then sync attendance + summary
  React.useEffect(() => {
    if (isProfessor && !selectedSlot) return;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        // Classes
        const classRes = await fetch(`${apiBase}/classes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!classRes.ok) throw new Error('Failed to fetch classes');

        type ClassResponse = { id: string; year: number; section: string };
        const classes: ClassResponse[] = await classRes.json();

        const cls = classes.find((c) => c.year.toString() === selectedYear && c.section === selectedSection);
        const cid = cls?.id || null;
        setClassId(cid);

        // Students
        const studentsRes = await fetch(
          `${apiBase}/students?year=${selectedYear}&section=${selectedSection}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!studentsRes.ok) throw new Error('Failed to fetch students');

        type StudentResponse = {
          id: string;
          name: string;
          rollNumber: number;
          collegeId: string;
          attendancePercentage: number;
        };

        const sdata: StudentResponse[] = await studentsRes.json();
        const mapped: AttendanceStudent[] = sdata.map((s) => ({
          id: s.id,
          name: s.name,
          rollNumber: s.rollNumber,
          collegeId: s.collegeId,
          attendancePercentage: s.attendancePercentage,
          present: null,
        }));

        setStudents(mapped);

        // Sync period attendance immediately
        await fetchAttendance();

        // Attendance summary (per subject)
        if (cid && selectedSubject) {
          const summaryRes = await fetch(
            `${apiBase}/attendance/summary?classId=${cid}&subjectId=${selectedSubject}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (summaryRes.ok) {
            type SummaryResponse = { studentId: string; attendancePercentage: number };
            const summary: SummaryResponse[] = await summaryRes.json();
            setStudents((prev) =>
              prev.map((student) => {
                const rec = summary.find((s) => String(s.studentId) === String(student.id));
                return rec ? { ...student, attendancePercentage: Math.round(rec.attendancePercentage) } : student;
              })
            );
          }
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchData();
  }, [selectedYear, selectedSection, selectedSubject, fetchAttendance, isProfessor, selectedSlot]);

  // Keep carousel on first page when list size/layout changes
  React.useEffect(() => {
    api?.scrollTo(0);
  }, [api, isDesktop, selectedYear, selectedSection, selectedSubject, selectedDate, selectedPeriod]);

  // Attendance toggles
  const toggleAttendance = (studentId: string) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, present: student.present === null ? true : !student.present }
          : student
      )
    );
  };

  const clearAttendance = (studentId: string) => {
    setStudents((prev) =>
      prev.map((student) => (student.id === studentId ? { ...student, present: null } : student))
    );
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, present: true })));
  };

  const markAllAbsent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, present: false })));
  };

  // Search + pagination
  const filteredStudents = students.filter(
    (student) =>
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

  // Summary widgets
  const presentCount = students.filter((s) => s.present === true).length;
  const absentCount = students.filter((s) => s.present === false).length;
  const attendanceRate =
    students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.attendancePercentage, 0) / students.length)
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

  const handleSaveAttendance = async () => {
    if (!selectedSubject) {
      toast({ variant: 'destructive', title: 'Select a subject first' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const attendanceData = students
        .filter((s) => s.present !== null)
        .map((s) => ({ studentId: Number(s.id), present: s.present }));
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
      if (!response.ok) throw new Error('Failed to save attendance');

      toast({ title: 'Attendance Saved', description: 'Attendance has been saved successfully' });
      await fetchAttendance();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save attendance' });
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {!isProfessor && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="year-select">Year</Label>
                  <select
                    id="year-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background text-foreground"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}st Year
                      </option>
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
                    {sections.map((section) => (
                      <option key={section} value={section}>
                        Section {section}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {isProfessor && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="slot-select">Choose Class Slot</Label>
                <select
                  id="slot-select"
                  value={selectedSlot}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedSlot(value);
                    const option = slotOptions.find((o) => o.value === value);
                    if (option) {
                      setSelectedYear(option.year);
                      setSelectedSection(option.section);
                      setSelectedSubject(option.subjectId);
                      setSelectedPeriod(option.value);
                      setPeriodOptions([option]);
                    } else {
                      setSelectedSubject('');
                      setSelectedPeriod(value);
                      setPeriodOptions([]);
                    }
                  }}
                  className="w-full p-2 border rounded-md bg-background text-foreground"
                >
                  <option value="">Select Slot</option>
                  {slotOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {`${option.label} – Year ${option.year}, Section ${option.section}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="date-select">Date</Label>
              <Input id="date-select" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period-select">Period</Label>
              <select
                id="period-select"
                value={selectedPeriod}
                onChange={(e) => {
                  const value = e.target.value;
                  const option = periodOptions.find((o) => o.value === value);
                  if (option) {
                    setSelectedYear(option.year);
                    setSelectedSection(option.section);
                    setSelectedSubject(option.subjectId);
                    setSelectedPeriod(option.value);
                  } else {
                    setSelectedSubject('');
                    setSelectedPeriod(value);
                  }
                }}
                className="w-full p-2 border rounded-md bg-background text-foreground"
              >
                <option value="">Select Period</option>
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
              <CardTitle>Student Attendance - Year {selectedYear}, Section {selectedSection}</CardTitle>
              <CardDescription>
                {selectedDate} • {periodOptions.find((p) => p.value === selectedPeriod)?.label}
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
                            student.present === true
                              ? 'border-green-200 bg-green-50'
                              : student.present === false
                              ? 'border-red-200 bg-red-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                          onClick={() => toggleAttendance(student.id)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <Checkbox
                              checked={student.present === null ? 'indeterminate' : student.present}
                              onCheckedChange={() => toggleAttendance(student.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex items-center gap-1">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  student.present === true
                                    ? 'bg-green-500'
                                    : student.present === false
                                    ? 'bg-red-500'
                                    : 'bg-gray-400'
                                }`}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-muted-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearAttendance(student.id);
                                }}
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="text-center space-y-2">
                            {/* Large Roll Number */}
                            <div className="text-4xl font-bold text-primary">{student.rollNumber}</div>

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
