import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import loaderMp2 from '@/Assets/loader.mp4';

interface SubjectOption {
  id: string;
  name: string;
}

interface StudentMark {
  student_id: string;
  student_name: string;
  roll_number: string;
  marks: number | null;
  max_marks: number | null;
}

const apiBase = import.meta.env.VITE_API_URL || '/api';

const THEME = {
  bgCream: '#fbf4ea',
  accent: '#8b0000',
  accent2: '#a52a2a',
  accent3: '#b86b2e',
  accent4: '#345b7a',
};

const EceVideoLoader: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] py-8">
    <video
      src={loaderMp2}
      autoPlay
      loop
      muted
      playsInline
      className="w-24 h-24 object-contain mb-4 rounded-lg shadow-lg"
      aria-label="Loading animation"
    />
    <div className="text-[#8b0000] font-semibold text-lg tracking-wide">
      {message || "Loading Marks..."}
    </div>
    <div className="text-[#a52a2a] text-sm mt-1">Please wait</div>
  </div>
);

const MarksOverview: React.FC = () => {
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [examType, setExamType] = useState<'mid1' | 'mid2' | 'mid3'>('mid1');
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [sortField, setSortField] = useState<'roll_number' | 'student_name' | 'marks'>('roll_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(false);
  const examTypeLabel =
    examType === 'mid1' ? 'Mid 1' : examType === 'mid2' ? 'Mid 2' : 'Mid 3';

  // Fetch subjects when year and semester selected
  useEffect(() => {
    if (year && semester) {
      setLoading(true);
      fetch(`${apiBase}/subjects?year=${year}&semester=${semester}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
        .then((res) => res.json())
        .then((data) => setSubjects(data))
        .catch(() => setSubjects([]))
        .finally(() => setLoading(false));
    } else {
      setSubjects([]);
      setSubject('');
    }
  }, [year, semester]);

  // Fetch marks when all filters selected
  useEffect(() => {
    if (year && semester && section && subject && examType) {
      setLoading(true);
      fetch(
        `${apiBase}/marks/overview?year=${year}&semester=${semester}&section=${section}&subjectId=${subject}&type=${examType}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      )
        .then((res) => res.json())
        .then((data) => setMarks(data))
        .catch(() => setMarks([]))
        .finally(() => setLoading(false));
    } else {
      setMarks([]);
    }
  }, [year, semester, section, subject, examType]);

  const handleSort = (field: 'roll_number' | 'student_name' | 'marks') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedMarks = [...marks].sort((a, b) => {
    const aVal = a[sortField] ?? '';
    const bVal = b[sortField] ?? '';
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Loader while fetching filters or marks
  const showLoader =
    loading && (year && semester && (!subject || (section && subject && examType)));

  // Helper for missing filters
  const missingFilters = [];
  if (!year) missingFilters.push('Year');
  if (!semester) missingFilters.push('Semester');
  if (!section) missingFilters.push('Section');
  if (!examType) missingFilters.push('Exam Type');
  if (!subject) missingFilters.push('Subject');

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{ background: THEME.bgCream }}
    >
      <div className="w-full max-w-5xl space-y-6 px-1 sm:px-2 py-2 sm:py-4 md:px-4">
        {/* Filters */}
        <Card className="shadow-lg border-[#b86b2e]">
          <CardHeader>
            <CardTitle className="text-[#8b0000]">Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <label className="text-sm font-semibold text-[#8b0000] mb-2 block">Year</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="border-[#8b0000] bg-[#fde8e6] text-[#8b0000] font-semibold rounded-md">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      Year {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#b86b2e] mb-2 block">Semester</label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="border-[#b86b2e] bg-[#fff6e6] text-[#b86b2e] font-semibold rounded-md">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#345b7a] mb-2 block">Section</label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="border-[#345b7a] bg-[#e8f0fb] text-[#345b7a] font-semibold rounded-md">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {['A', 'B', 'C', 'D', 'E'].map((sec) => (
                    <SelectItem key={sec} value={sec}>
                      {sec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#a52a2a] mb-2 block">Exam Type</label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger className="border-[#a52a2a] bg-[#fde8e6] text-[#a52a2a] font-semibold rounded-md">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mid1">Mid 1</SelectItem>
                  <SelectItem value="mid2">Mid 2</SelectItem>
                  <SelectItem value="mid3">Mid 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#0f766e] mb-2 block">Subject</label>
              <Select value={subject} onValueChange={setSubject} disabled={!subjects.length}>
                <SelectTrigger className="border-[#0f766e] bg-[#e8fbf5] text-[#0f766e] font-semibold rounded-md">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subj) => (
                    <SelectItem key={subj.id} value={String(subj.id)}>
                      {subj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Show missing filter info */}
        {missingFilters.length > 0 && (
          <div className="w-full text-center py-2">
            <span className="inline-block bg-[#fde8e6] text-[#8b0000] px-3 py-1 rounded font-semibold text-sm">
              Please select: {missingFilters.join(', ')}
            </span>
          </div>
        )}

        {/* Loader */}
        {showLoader && <EceVideoLoader message="Fetching Data..." />}

        {/* View Marks Table */}
        {!showLoader && marks.length > 0 && (
          <Card className="shadow-lg border-[#b86b2e]">
            <CardHeader>
              <CardTitle className="text-[#8b0000]">Student Marks - {examTypeLabel}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table className="min-w-[400px]">
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer text-[#8b0000] font-bold"
                      onClick={() => handleSort('roll_number')}
                    >
                      Roll No
                    </TableHead>
                    <TableHead
                      className="cursor-pointer text-[#b86b2e] font-bold"
                      onClick={() => handleSort('student_name')}
                    >
                      Name
                    </TableHead>
                    <TableHead
                      className="cursor-pointer text-[#345b7a] font-bold"
                      onClick={() => handleSort('marks')}
                    >
                      Marks
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMarks.map((m) => (
                    <TableRow key={m.student_id} className="hover:bg-[#fde8e6] transition-colors">
                      <TableCell className="font-semibold">{m.roll_number}</TableCell>
                      <TableCell>{m.student_name}</TableCell>
                      <TableCell>
                        {m.marks != null && m.max_marks != null
                          ? <span className="font-semibold text-[#0f766e]">{m.marks}/{m.max_marks}</span>
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* No marks found */}
        {!showLoader && marks.length === 0 && year && semester && section && subject && examType && (
          <Card className="shadow-lg border-[#b86b2e]">
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2 text-[#8b0000]">No marks found</h3>
              <p className="text-[#a52a2a]">
                No marks data available for the selected filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MarksOverview;
