import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

const MarksOverview: React.FC = () => {
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [sortField, setSortField] = useState<'roll_number' | 'student_name' | 'marks'>('roll_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch subjects when year and semester selected
  useEffect(() => {
    if (year && semester) {
      fetch(`${apiBase}/subjects?year=${year}&semester=${semester}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
        .then((res) => res.json())
        .then((data) => setSubjects(data))
        .catch(() => setSubjects([]));
    } else {
      setSubjects([]);
    }
    setSubject('');
  }, [year, semester]);

  // Fetch marks when all filters selected
  useEffect(() => {
    if (year && semester && section && subject) {
      fetch(
        `${apiBase}/marks/overview?year=${year}&semester=${semester}&section=${section}&subjectId=${subject}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      )
        .then((res) => res.json())
        .then((data) => setMarks(data))
        .catch(() => setMarks([]));
    } else {
      setMarks([]);
    }
  }, [year, semester, section, subject]);

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

  return (
    <div className="space-y-6 px-4 sm:px-6 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Marks Overview
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Year</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
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
            <label className="text-sm font-medium mb-2 block">Semester</label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Section</label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger>
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
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <Select value={subject} onValueChange={setSubject} disabled={!subjects.length}>
              <SelectTrigger>
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

      {marks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('roll_number')}>
                    Roll No
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('student_name')}>
                    Name
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('marks')}>
                    Marks
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMarks.map((m) => (
                  <TableRow key={m.student_id}>
                    <TableCell>{m.roll_number}</TableCell>
                    <TableCell>{m.student_name}</TableCell>
                    <TableCell>
                      {m.marks != null && m.max_marks != null
                        ? `${m.marks}/${m.max_marks}`
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MarksOverview;
