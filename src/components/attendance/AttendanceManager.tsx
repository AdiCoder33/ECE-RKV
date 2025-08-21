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
import loaderMp4 from '@/Assets/loader.mp4';

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
  year?: number;
  semester?: number;
  section?: string;
  subject_id?: string;
  faculty_id?: number | null;
}

interface PeriodOption {
  value: string; // period number
  label: string; // "09:00-10:00 – Subject"
  subjectId: string;
  year: string;
  semester: string;
  section: string;
}

const apiBase = import.meta.env.VITE_API_URL || '/api';

// ECE Theme colors matching UserManagement
const THEME = {
  bgBeige: '#fbf4ea',
  accent: '#8b0000',
  accentHover: '#a52a2a',
  cardBg: 'bg-white',
  cardShadow: 'shadow-lg',
  textMuted: 'text-gray-600'
};

// Attendance-specific colors (keeping functional color coding)
const ATTENDANCE_COLORS = {
  present: '#10b981', // Green for present
  absent: '#ef4444', // Red for absent
  warning: '#f59e0b', // Amber for warning
  neutral: '#6b7280', // Gray for neutral
  lightPresent: '#f0fdf4', // Light green background
  lightAbsent: '#fef2f2', // Light red background
  lightWarning: '#fffbeb', // Light amber background
};

// Map from "start-end" time to period number
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
  const [selectedSlot, setSelectedSlot] = React.useState(''); // for professors
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const isDesktop = useMediaQuery('(min-width:768px)');
  const itemsPerPage = isDesktop ? 15 : 9;

  // Access control
  const hasFullAccess = user?.role === 'admin' || user?.role === 'hod';
  const isProfessor = user?.role === 'professor';

  const [students, setStudents] = React.useState<AttendanceStudent[]>([]);
  const [classId, setClassId] = React.useState<string | null>(null);

  // Filter years and sections
  const getAllowedYears = () => (hasFullAccess ? ['1', '2', '3', '4'] : ['3', '4']);
  const getAllowedSections = () => (hasFullAccess ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B']);

  const years = getAllowedYears();
  const sections = getAllowedSections();

  const getCurrentSemester = () => {
    const month = new Date().getMonth() + 1;
    return month >= 6 && month <= 11 ? '1' : '2';
  };
  const currentSemester = getCurrentSemester();

  // Subjects
  React.useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${apiBase}/subjects?year=${selectedYear}&semester=${currentSemester}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error('Failed to fetch subjects');
        const data: { id: string; name: string }[] = await response.json();
        setSubjects(data);
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
    };
    fetchSubjects();
  }, [selectedYear, currentSemester]);

  // Convert subject name from URL to ID once subjects arrive
  React.useEffect(() => {
    if (subjects.length > 0 && selectedSubject && isNaN(Number(selectedSubject))) {
      const match = subjects.find((s) => s.name === selectedSubject);
      setSelectedSubject(match ? match.id : '');
    }
  }, [subjects, selectedSubject]);

  // Timetable for non-professors (class-wise)
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
      } catch (err) {
        console.error('Error fetching timetable:', err);
      }
    };
    fetchTimetable();
  }, [selectedYear, selectedSection, currentSemester, isProfessor]);

  // Timetable for professors (faculty/day-wise)
  React.useEffect(() => {
    if (!isProfessor || typeof user?.id !== 'number') return;
    const fetchProfessorTimetable = async () => {
      try {
        const token = localStorage.getItem('token');
        const weekday = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
        const response = await fetch(
          `${apiBase}/timetable?facultyId=${String(user.id)}&day=${weekday}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error('Failed to fetch timetable');
        const data: TimetableSlot[] = await response.json();
        setTimetable(data);
      } catch (err) {
        console.error('Error fetching timetable:', err);
      }
    };
    fetchProfessorTimetable();
  }, [isProfessor, user?.id, selectedDate]);

  // Build period options from timetable for selected date
  React.useEffect(() => {
    const day = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
    const daySlots = timetable.filter((slot) => slot.day === day);
    const options: PeriodOption[] = daySlots
      .map((slot) => {
        const periodNumber = TIME_TO_PERIOD[slot.time];
        const subjectId =
          slot.subject_id ? String(slot.subject_id) : subjects.find((s) => s.name === slot.subject)?.id;
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
    if (!isProfessor) setPeriodOptions(options);
  }, [timetable, selectedDate, subjects, selectedYear, selectedSection, currentSemester, isProfessor]);

  // Reset for professors when date changes
  React.useEffect(() => {
    if (isProfessor) {
      setSelectedSlot('');
      setSelectedPeriod('');
      setPeriodOptions([]);
    }
  }, [selectedDate, isProfessor]);

  // Fetch attendance for current selection
  const fetchAttendance = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${apiBase}/attendance?year=${selectedYear}&section=${selectedSection}&date=${selectedDate}`;
      if (selectedSubject) url += `&subjectId=${selectedSubject}`;

      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
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
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  }, [selectedDate, selectedPeriod, selectedYear, selectedSection, selectedSubject]);

  // Fetch classes, students, then sync attendance + summary
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
      } catch (err) {
        console.error('Error fetching students:', err);
      }
    };

    fetchData();
  }, [selectedYear, selectedSection, selectedSubject, fetchAttendance, isProfessor, selectedSlot]);

  // Keep carousel on first page when layout changes
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

  const getAttendanceBadge = (percentage: number) => {
    if (percentage >= 85) return { variant: 'default' as const, label: 'Good', color: ATTENDANCE_COLORS.present };
    if (percentage >= 75) return { variant: 'secondary' as const, label: 'Warning', color: ATTENDANCE_COLORS.warning };
    return { variant: 'destructive' as const, label: 'Critical', color: ATTENDANCE_COLORS.absent };
  };

  const handleSaveAttendance = async () => {
    if (!selectedSubject) {
      toast({ variant: 'destructive', title: 'Select a subject first' });
      return;
    }
    if (!selectedPeriod) {
      toast({ variant: 'destructive', title: 'Select a period first' });
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
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save attendance' });
    }
  };

  // ECE-themed loader matching UserManagement
  const EceVideoLoader: React.FC = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
      <video
        src={loaderMp4}
        autoPlay
        loop
        muted
        playsInline
        className="w-40 h-40 object-contain mb-4 rounded-lg shadow-lg"
        aria-label="Loading animation"
      />
      <div className="font-semibold text-lg tracking-wide" style={{ color: THEME.accent }}>
        Loading Attendance...
      </div>
      <div className="text-sm mt-1 text-gray-600">Fetching attendance data, please wait</div>
    </div>
  );

  // Minimal loader timing
  React.useEffect(() => {
    const fetchAll = async () => {
      const start = Date.now();
      try {
        // Effects above fetch data individually; we just keep a graceful loader duration.
      } catch {
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
  }, []);

  if (loading)
    return (
      <div className="p-0 flex items-center justify-center min-h-screen" style={{ backgroundColor: THEME.bgBeige }}>
        <EceVideoLoader />
      </div>
    );
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: THEME.bgBeige }}>
      <div className="mx-auto w-full max-w-7xl px-2 sm:px-4 md:px-8 py-3 sm:py-6 md:py-8 space-y-3 sm:space-y-6">
        {/* Header */}
        <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-xl hover:shadow-xl transition-all`}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <div className="space-y-1">
                <h1
                  className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight"
                  style={{ color: THEME.accent }}
                >
                  Attendance Management
                </h1>
                <p className="text-xs sm:text-base text-gray-600">
                  Mark and track student attendance
                </p>
              </div>
              <div className="flex items-center gap-1 sm:gap-3">
                <Button
                  variant="outline"
                  className="border rounded-md px-2 py-1 text-sm sm:text-base border-gray-300 hover:bg-gray-50"
                  style={{ color: THEME.accent }}
                >
                  <Download className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Export</span>
                </Button>
                <Button
                  variant="outline"
                  className="border rounded-md px-2 py-1 text-sm sm:text-base border-gray-300 hover:bg-gray-50"
                  style={{ color: THEME.accent }}
                >
                  <Upload className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Import</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class / Slot / Date / Period */}
        <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-xl hover:shadow-xl transition-all`}>
          <CardContent className="p-3 sm:p-5 md:p-6">
            {isProfessor && (
              <div
                className="rounded-lg p-2 mb-3 border"
                style={{ backgroundColor: '#fff5f5', borderColor: '#fca5a5' }}
              >
                <p className="text-xs sm:text-sm" style={{ color: THEME.accent }}>
                  <strong>Professor Access:</strong> You can only mark attendance for your assigned classes and subjects.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-5 gap-2 sm:gap-4">
              {/* For Professors: Slot select; For others: Year & Section */}
              {isProfessor ? (
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="slot-select" style={{ color: THEME.accent, fontSize: 13 }}>
                    Choose Class Slot
                  </Label>
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
                        setSelectedPeriod('');
                        setPeriodOptions([]);
                      }
                    }}
                    className="w-full p-2 rounded-md text-sm border border-gray-300 bg-white focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
                    style={{ color: THEME.accent }}
                  >
                    <option value="">Select Slot</option>
                    {slotOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {`${option.label} – Year ${option.year}, Section ${option.section}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="year-select" style={{ color: THEME.accent, fontSize: 13 }}>
                      Year
                    </Label>
                    <select
                      id="year-select"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full p-2 rounded-md text-sm border border-gray-300 bg-white focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
                      style={{ color: THEME.accent }}
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}st Year
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="section-select" style={{ color: THEME.accent, fontSize: 13 }}>
                      Section
                    </Label>
                    <select
                      id="section-select"
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full p-2 rounded-md text-sm border border-gray-300 bg-white focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
                      style={{ color: THEME.accent }}
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

              <div className="space-y-1">
                <Label htmlFor="date-select" style={{ color: THEME.accent, fontSize: 13 }}>
                  Date
                </Label>
                <Input
                  id="date-select"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-sm border-gray-300 focus:border-[#8b0000] focus:ring-[#8b0000]"
                  style={{ color: THEME.accent }}
                />
              </div>

              <div className="space-y-1 xs:col-span-2 md:col-span-2">
                <Label htmlFor="period-select" style={{ color: THEME.accent, fontSize: 13 }}>
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
                  className="w-full p-2 rounded-md text-sm border border-gray-300 bg-white focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
                  style={{ color: THEME.accent }}
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

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
          <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}>
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Total Students
                  </p>
                  <p className="text-lg sm:text-2xl font-bold" style={{ color: THEME.accent }}>
                    {students.length}
                  </p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#e8f0fb' }}>
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-[#345b7a]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}>
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Present
                  </p>
                  <p className="text-lg sm:text-2xl font-bold" style={{ color: ATTENDANCE_COLORS.present }}>
                    {presentCount}
                  </p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: ATTENDANCE_COLORS.lightPresent }}>
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: ATTENDANCE_COLORS.present }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}>
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Absent
                  </p>
                  <p className="text-lg sm:text-2xl font-bold" style={{ color: ATTENDANCE_COLORS.absent }}>
                    {absentCount}
                  </p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: ATTENDANCE_COLORS.lightAbsent }}>
                  <XCircle className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: ATTENDANCE_COLORS.absent }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}>
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="w-full">
                  <p className="text-xs font-medium text-gray-600">
                    Attendance Rate
                  </p>
                  <div className="flex items-end justify-between">
                    <p className="text-lg sm:text-2xl font-bold" style={{ color: THEME.accent }}>
                      {attendanceRate}%
                    </p>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#fff6e6' }}>
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-[#b86b2e]" />
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${attendanceRate}%`,
                        backgroundColor: THEME.accent
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students */}
        <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-xl hover:shadow-xl transition-all`}>
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base sm:text-lg" style={{ color: THEME.accent }}>
                  Student Attendance – Year {selectedYear}, Section {selectedSection}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600">
                  {selectedDate} • {periodOptions.find((p) => p.value === selectedPeriod)?.label}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border rounded px-2 py-1 text-xs sm:text-sm border-gray-300 hover:bg-gray-50"
                  style={{ color: ATTENDANCE_COLORS.present }}
                  onClick={markAllPresent}
                >
                  Mark All Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border rounded px-2 py-1 text-xs sm:text-sm border-gray-300 hover:bg-gray-50"
                  style={{ color: ATTENDANCE_COLORS.absent }}
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
                  className="pl-9 h-8 sm:h-10 border border-gray-300 focus:border-[#8b0000] focus:ring-[#8b0000] bg-white text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="border rounded border-gray-300 hover:bg-gray-50 h-8 w-8 sm:h-10 sm:w-10"
                style={{ color: THEME.accent }}
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
                              'p-2 sm:p-4 border-2 transition-all cursor-pointer rounded-xl hover:shadow-md',
                              present
                                ? 'border-green-300 bg-green-50'
                                : absent
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-200 bg-white',
                            ].join(' ')}
                            onClick={() => toggleAttendance(student.id)}
                          >
                            <div className="flex items-center justify-between mb-1 sm:mb-3">
                              <Checkbox
                                checked={student.present === true}
                                onCheckedChange={() => toggleAttendance(student.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="data-[state=checked]:border-[#8b0000] data-[state=checked]:bg-[#8b0000]"
                              />
                              <div className="flex items-center gap-1">
                                <div
                                  className={[
                                    'w-2 h-2 rounded-full',
                                    present ? 'bg-green-500' : absent ? 'bg-red-500' : 'bg-gray-300',
                                  ].join(' ')}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-gray-500 hover:text-[#8b0000]"
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
                              <div className="text-lg sm:text-2xl font-extrabold leading-none" style={{ color: THEME.accent }}>
                                {student.rollNumber}
                              </div>
                              <p className="font-medium text-[12px] sm:text-sm text-gray-800 line-clamp-1">
                                {student.name}
                              </p>
                              <p className="text-[10px] sm:text-xs text-gray-500 font-mono break-all">
                                {student.collegeId}
                              </p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[10px] sm:text-xs font-medium" style={{ color: THEME.accent }}>
                                  {student.attendancePercentage}%
                                </span>
                                <Badge 
                                  variant={attendanceBadge.variant} 
                                  className="hidden md:inline-flex text-[10px]"
                                  style={{ 
                                    backgroundColor: attendanceBadge.color + '20',
                                    color: attendanceBadge.color,
                                    borderColor: attendanceBadge.color
                                  }}
                                >
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
                <CarouselPrevious className="relative left-0 border border-gray-300 hover:bg-gray-50 h-8 w-8" style={{ color: THEME.accent }} />
                <CarouselNext className="relative right-0 border border-gray-300 hover:bg-gray-50 h-8 w-8" style={{ color: THEME.accent }} />
              </div>
            </Carousel>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            className="hover:brightness-95 h-9 px-6 text-sm rounded-lg"
            style={{
              backgroundColor: THEME.accent,
              color: '#fff',
            }}
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
