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
import loaderMp2 from '@/Assets/loader.mp4';

const MIN_LOADER_TIME = 1500; // milliseconds

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
}

interface PeriodOption {
  value: string;
  label: string;
  subjectId: string;
}

const apiBase = import.meta.env.VITE_API_URL || '/api';

// Update the COLORS palette for a softer, more modern look
const COLORS = {
  accent: '#8B0000', // Deep red for headlines
  subAccent: '#B23A48', // Muted red for subheadlines
  cream: '#f7ede0ff', // Cream background
  card: '#FFFFFF', // Card background
  border: '#E5E3DD', // Soft border
  text: '#2D2D2D', // Main text
  muted: '#6B7280', // Muted text
  present: '#3BA55D', // Green for present
  absent: '#E57373', // Soft red for absent
  warning: '#FBC02D', // Yellow for warning
  blue: '#4F8FC0', // Soft blue for accents
  grayBtn: '#F3F4F6', // Light gray for buttons
};

const AttendanceManager: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSubject = searchParams.get('subject') || '';
  const { toast } = useToast();

  const [selectedYear, setSelectedYear] = React.useState('1');
  const [selectedSection, setSelectedSection] = React.useState('A');
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = React.useState('');
  const [subjects, setSubjects] = React.useState<{ id: string; name: string }[]>([]);
  const [selectedSubject, setSelectedSubject] = React.useState(initialSubject);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [timetable, setTimetable] = React.useState<TimetableSlot[]>([]);
  const [periodOptions, setPeriodOptions] = React.useState<PeriodOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
    // No change to logic
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

  // Fetch timetable for the selected class
  React.useEffect(() => {
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
  }, [selectedYear, selectedSection, currentSemester]);

  // Build period options based on timetable and date
  React.useEffect(() => {
    const day = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
    const daySlots = timetable.filter((slot) => slot.day === day);
    const timeToPeriod: Record<string, string> = {
      '09:00-10:00': '1',
      '10:00-11:00': '2',
      '11:00-12:00': '3',
      '14:00-15:00': '4',
      '15:00-16:00': '5',
      '16:00-17:00': '6',
    };
    const options: PeriodOption[] = daySlots
      .map((slot) => {
        const periodNumber = timeToPeriod[slot.time];
        const subjectMatch = subjects.find((s) => s.name === slot.subject);
        if (!periodNumber || !subjectMatch) return null;
        return {
          value: periodNumber,
          label: `${slot.time} – ${slot.subject}`,
          subjectId: subjectMatch.id,
        };
      })
      .filter((opt): opt is PeriodOption => opt !== null);
    setPeriodOptions(options);
  }, [timetable, selectedDate, subjects]);

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
  }, [selectedYear, selectedSection, selectedSubject, fetchAttendance]);

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

  // ECE color scale (reds only)
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return 'text-red-600';
    if (percentage >= 75) return 'text-red-500';
    return 'text-red-800';
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

  // Loader component using loader.mp4 video
  const EceVideoLoader: React.FC = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
      <video
        src={loaderMp2}
        autoPlay
        loop
        muted
        playsInline
        className="w-40 h-40 object-contain mb-4 rounded-lg shadow-lg"
        aria-label="Loading animation"
      />
      <div className="text-[#8b0000] font-semibold text-lg tracking-wide">Loading Attendance...</div>
      <div className="text-[#a52a2a] text-sm mt-1">Fetching attendance data, please wait</div>
    </div>
  );

  // Fetch all required data with minimum loader time
  React.useEffect(() => {
    const fetchAll = async () => {
      const start = Date.now();
      try {
        // You may want to fetch subjects, timetable, students, etc. here
        // For example:
        // await Promise.all([fetchSubjects(), fetchTimetable(), fetchStudents()]);
        // But since you have multiple useEffects, just wait for a short time
      } catch (err) {
        setError('Failed to load attendance data');
      } finally {
        const elapsed = Date.now() - start;
        if (elapsed < MIN_LOADER_TIME) {
          setTimeout(() => setLoading(false), MIN_LOADER_TIME - elapsed);
        } else {
          setLoading(false);
        }
      }
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return (
      <div className="p-0 flex items-center justify-center min-h-screen" style={{ background: COLORS.cream }}>
        <EceVideoLoader />
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-red-600">{error}</div>
    );

  return (
    <div className="min-h-screen w-full" style={{ background: COLORS.cream }}>
      <div className="mx-auto w-full max-w-7xl px-2 sm:px-4 md:px-8 py-3 sm:py-6 md:py-8 space-y-3 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="space-y-1">
            <h1
              className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight"
              style={{ color: COLORS.accent }}
            >
              Attendance Management
            </h1>
            <p className="text-xs sm:text-base" style={{ color: COLORS.subAccent }}>
              Mark and track student attendance
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <Button
              variant="outline"
              className="border rounded-md px-2 py-1 text-sm sm:text-base"
              style={{
                borderColor: COLORS.border,
                color: COLORS.blue,
                background: COLORS.grayBtn,
                minWidth: 0,
              }}
            >
              <Download className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Export</span>
            </Button>
            <Button
              variant="outline"
              className="border rounded-md px-2 py-1 text-sm sm:text-base"
              style={{
                borderColor: COLORS.border,
                color: COLORS.blue,
                background: COLORS.grayBtn,
                minWidth: 0,
              }}
            >
              <Upload className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Import</span>
            </Button>
          </div>
        </div>

        {/* Class and Date Selection */}
        <Card style={{ background: COLORS.card, borderColor: COLORS.border }}>
          <CardContent className="p-3 sm:p-5 md:p-6">
            {isProfessor && (
              <div
                className="rounded-lg p-2 mb-3"
                style={{ background: '#FDEFEF', border: `1px solid ${COLORS.border}` }}
              >
                <p className="text-xs sm:text-sm" style={{ color: COLORS.accent }}>
                  <strong>Professor Access:</strong> You can only mark attendance for your assigned classes and subjects.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-5 gap-2 sm:gap-4">
              <div className="space-y-1">
                <Label htmlFor="year-select" style={{ color: COLORS.accent, fontSize: 13 }}>
                  Year
                </Label>
                <select
                  id="year-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full p-2 rounded-md text-sm"
                  style={{
                    background: COLORS.card,
                    color: COLORS.text,
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}st Year
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="section-select" style={{ color: COLORS.accent, fontSize: 13 }}>
                  Section
                </Label>
                <select
                  id="section-select"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full p-2 rounded-md text-sm"
                  style={{
                    background: COLORS.card,
                    color: COLORS.text,
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  {sections.map((section) => (
                    <option key={section} value={section}>
                      Section {section}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="date-select" style={{ color: COLORS.accent, fontSize: 13 }}>
                  Date
                </Label>
                <Input
                  id="date-select"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-sm"
                  style={{
                    background: COLORS.card,
                    color: COLORS.text,
                    border: `1px solid ${COLORS.border}`,
                  }}
                />
              </div>
              <div className="space-y-1 xs:col-span-2 md:col-span-2">
                <Label htmlFor="period-select" style={{ color: COLORS.accent, fontSize: 13 }}>
                  Period
                </Label>
                <select
                  id="period-select"
                  value={selectedPeriod}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedPeriod(value);
                    const option = periodOptions.find((o) => o.value === value);
                    setSelectedSubject(option?.subjectId || '');
                  }}
                  className="w-full p-2 rounded-md text-sm"
                  style={{
                    background: COLORS.card,
                    color: COLORS.text,
                    border: `1px solid ${COLORS.border}`,
                  }}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
          <Card style={{ background: COLORS.card, borderColor: COLORS.border }}>
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: COLORS.muted }}>
                    Total Students
                  </p>
                  <p className="text-lg sm:text-2xl font-bold" style={{ color: COLORS.accent }}>
                    {students.length}
                  </p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: COLORS.blue }} />
              </div>
            </CardContent>
          </Card>
          <Card style={{ background: COLORS.card, borderColor: COLORS.border }}>
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: COLORS.muted }}>
                    Present
                  </p>
                  <p className="text-lg sm:text-2xl font-bold" style={{ color: COLORS.present }}>
                    {presentCount}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: COLORS.present }} />
              </div>
            </CardContent>
          </Card>
          <Card style={{ background: COLORS.card, borderColor: COLORS.border }}>
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: COLORS.muted }}>
                    Absent
                  </p>
                  <p className="text-lg sm:text-2xl font-bold" style={{ color: COLORS.absent }}>
                    {absentCount}
                  </p>
                </div>
                <XCircle className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: COLORS.absent }} />
              </div>
            </CardContent>
          </Card>
          <Card style={{ background: COLORS.card, borderColor: COLORS.border }}>
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="w-full">
                  <p className="text-xs font-medium" style={{ color: COLORS.muted }}>
                    Attendance Rate
                  </p>
                  <div className="flex items-end justify-between">
                    <p className="text-lg sm:text-2xl font-bold" style={{ color: COLORS.blue }}>
                      {attendanceRate}%
                    </p>
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: COLORS.blue }} />
                  </div>
                  <Progress value={attendanceRate} className="mt-2 h-2" style={{ background: COLORS.cream }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Attendance Grid */}
        <Card style={{ background: COLORS.card, borderColor: COLORS.border }}>
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base sm:text-lg" style={{ color: COLORS.accent }}>
                  Student Attendance – Year {selectedYear}, Section {selectedSection}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm" style={{ color: COLORS.blue }}>
                  {selectedDate} • {periodOptions.find((p) => p.value === selectedPeriod)?.label}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border rounded px-2 py-1 text-xs sm:text-sm"
                  style={{
                    borderColor: COLORS.border,
                    color: COLORS.present,
                    background: COLORS.grayBtn,
                  }}
                  onClick={markAllPresent}
                >
                  Mark All Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border rounded px-2 py-1 text-xs sm:text-sm"
                  style={{
                    borderColor: COLORS.border,
                    color: COLORS.absent,
                    background: COLORS.grayBtn,
                  }}
                  onClick={markAllAbsent}
                >
                  Mark All Absent
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-4 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 sm:h-10 border border-gray-200 focus-visible:ring-blue-200 bg-white text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="border rounded text-blue-700 hover:bg-blue-50 h-8 w-8 sm:h-10 sm:w-10"
                style={{
                  borderColor: COLORS.border,
                  background: COLORS.grayBtn,
                }}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-2 sm:pt-0">
            <Carousel setApi={setApi}>
              <CarouselContent>
                {studentChunks.map((chunk, index) => (
                  <CarouselItem key={index}>
                    <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                      {chunk.map((student) => {
                        const attendanceBadge = getAttendanceBadge(student.attendancePercentage);
                        const present = student.present === true;
                        const absent = student.present === false;

                        return (
                          <Card
                            key={student.id}
                            className={[
                              'p-2 sm:p-4 border-2 transition-all cursor-pointer rounded-xl',
                              present
                                ? 'border-green-200 bg-green-50'
                                : absent
                                ? 'border-gray-300 bg-gray-50'
                                : 'border-gray-200 bg-white',
                              'hover:shadow-sm',
                            ].join(' ')}
                            onClick={() => toggleAttendance(student.id)}
                          >
                            <div className="flex items-center justify-between mb-1 sm:mb-3">
                              <Checkbox
                                checked={student.present === null ? 'indeterminate' : student.present}
                                onCheckedChange={() => toggleAttendance(student.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                              />
                              <div className="flex items-center gap-1">
                                <div
                                  className={[
                                    'w-2 h-2 rounded-full',
                                    present ? 'bg-green-500' : absent ? 'bg-gray-400' : 'bg-gray-200',
                                  ].join(' ')}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-gray-500 hover:text-blue-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    clearAttendance(student.id);
                                  }}
                                  title="Clear"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="text-center space-y-1.5">
                              {/* Large Roll Number */}
                              <div className="text-lg sm:text-2xl font-extrabold text-blue-700 leading-none">
                                {student.rollNumber}
                              </div>

                              {/* Student Name */}
                              <p className="font-medium text-[12px] sm:text-sm text-foreground line-clamp-1">
                                {student.name}
                              </p>

                              {/* College ID */}
                              <p className="text-[10px] sm:text-xs text-gray-500 font-mono break-all">
                                {student.collegeId}
                              </p>

                              {/* Attendance Percentage and Badge */}
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[10px] sm:text-xs font-medium text-blue-700">
                                  {student.attendancePercentage}%
                                </span>
                                <Badge variant={attendanceBadge.variant} className="hidden md:inline-flex text-[10px]">
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

              <div className="mt-2 flex items-center justify-between">
                <CarouselPrevious className="relative left-0 border border-gray-300 text-blue-700 hover:bg-blue-50 h-8 w-8" />
                <CarouselNext className="relative right-0 border border-gray-300 text-blue-700 hover:bg-blue-50 h-8 w-8" />
              </div>
            </Carousel>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            style={{
              background: COLORS.blue,
              color: '#fff',
              borderRadius: '0.75rem',
              height: '2.25rem',
              padding: '0 1.2rem',
              fontSize: 15,
            }}
            className="hover:brightness-95"
            onClick={handleSaveAttendance}
          >
            <Save className="h-4 w-4 mr-1" />
            Save Attendance
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManager;
