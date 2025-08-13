import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Upload, Download, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import * as XLSX from 'xlsx';

interface MarkRow {
  email: string;
  subject: string;
  maxMarks: number;
  marks: number | null;
}

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

interface ExcelRow {
  email: string | number;
  subject: string;
  maxMarks: string | number;
  obtainedMarks: string | number;
}

const apiBase = import.meta.env.VITE_API_URL || '/api';

const MarksUpload = () => {
  const [rows, setRows] = useState<MarkRow[]>([]);
  const [hasBlankMarks, setHasBlankMarks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [sortField, setSortField] = useState<'roll_number' | 'student_name' | 'marks'>('roll_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Fetch subjects when year and semester are selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (year && semester) {
        try {
          const res = await fetch(`${apiBase}/subjects?year=${year}&semester=${semester}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          if (!res.ok) {
            const err = await res.json();
            toast.error(err.error ?? 'Failed to fetch subjects');
            setSubjects([]);
            return;
          }
          const data = await res.json();
          setSubjects(data);
        } catch (error) {
          toast.error((error as Error).message ?? 'Failed to fetch subjects');
          setSubjects([]);
        }
      } else {
        setSubjects([]);
      }
    };
    fetchSubjects();
    setSubject('');
  }, [year, semester]);

  const fetchMarks = async () => {
    if (year && semester && section && subject) {
      try {
        const res = await fetch(
          `${apiBase}/marks/overview?year=${year}&semester=${semester}&section=${section}&subjectId=${subject}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error ?? 'Failed to fetch marks');
          setMarks([]);
          return;
        }
        const data = await res.json();
        setMarks(data);
      } catch (error) {
        toast.error((error as Error).message ?? 'Failed to fetch marks');
        setMarks([]);
      }
    } else {
      setMarks([]);
    }
  };

  // Fetch marks whenever filters change
  useEffect(() => {
    fetchMarks();
  }, [year, semester, section, subject]);

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const input = event.target;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
          defval: '',
          header: ['email', 'subject', 'maxMarks', 'obtainedMarks'],
          range: 1,
        });

        const parsed: MarkRow[] = [];
        const invalidEmails: string[] = [];
        const missingMarks: string[] = [];
        json.forEach((row) => {
          const email = row.email?.toString().trim();
          const subject = row.subject?.toString().trim();
          const maxMarks = Number(row.maxMarks);
          const marksStr = row.obtainedMarks?.toString().trim();
          const marks = marksStr === '' ? null : Number(marksStr);

          if (email && subject) {
            if (marks === null) {
              missingMarks.push(email);
              parsed.push({ email, subject, maxMarks: Number(maxMarks), marks: null });
            } else if (Number.isNaN(marks) || Number.isNaN(maxMarks)) {
              invalidEmails.push(email);
            } else {
              parsed.push({ email, subject, maxMarks: Number(maxMarks), marks });
            }
          }
        });

        // Ensure rows state is always a true array
        setRows([...parsed]);
        setHasBlankMarks(missingMarks.length > 0);
        if (parsed.length > 0) {
          toast.success(`Uploaded ${parsed.length} rows`);
        }
        if (invalidEmails.length > 0) {
          toast.error(`Invalid marks for: ${invalidEmails.join(', ')}`);
        }
        if (missingMarks.length > 0) {
          toast.error(`Missing obtained marks for: ${missingMarks.join(', ')}`);
        }
        if (
          parsed.length === 0 &&
          invalidEmails.length === 0 &&
          missingMarks.length === 0
        ) {
          toast.error('No valid rows found');
        }
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        input.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = async () => {
    if (!year || !semester || !section || !subject) {
      toast.error('Please select year, semester, section and subject');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${apiBase}/students?year=${year}&semester=${semester}&section=${section}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? 'Failed to fetch students');
        return;
      }

      const students: { email: string }[] = await res.json();
      const subjectName = subjects.find((s) => String(s.id) === subject)?.name || '';

      const sheetData = students.map((s) => ({
        email: s.email,
        subject: subjectName,
        maxMarks: '',
        obtainedMarks: '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(sheetData, {
        header: ['email', 'subject', 'maxMarks', 'obtainedMarks'],
      });
      if (worksheet['D1']) {
        worksheet['D1'].v = 'obtainedMarks (required)';
      }
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Marks');
      XLSX.writeFile(workbook, 'marks_template.xlsx');
      setIsDownloadModalOpen(false);
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to fetch students');
    }
  };

  const submitMarks = async () => {
    if (rows.length === 0) {
      toast.error('Please upload marks file first');
      return;
    }

    if (rows.some((r) => r.marks === null)) {
      toast.error('Please fill in all obtained marks before submitting');
      return;
    }

    try {
      setLoading(true);
      console.log('Submitting rows', Array.isArray(rows), rows);
      const response = await fetch(`${apiBase}/marks/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: 'internal',
          date: new Date().toISOString(),
          marksData: rows, // rows must be a true Array
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        const message = err.error || (Array.isArray(err.errors) ? err.errors.join(', ') : 'Failed to submit marks');
        toast.error(message);
        return;
      }

      toast.success('Marks submitted successfully!');
      setRows([]);
      setHasBlankMarks(false);
      fetchMarks();
    } catch (error) {
      toast.error('Failed to submit marks');
    } finally {
      setLoading(false);
    }
  };

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
          Marks Upload
        </h1>
        <Button variant="outline" onClick={() => setIsDownloadModalOpen(true)}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Upload Marks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleExcelUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="excel-upload"
            />
            <Button variant="outline" asChild>
              <label htmlFor="excel-upload" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Upload Excel
              </label>
            </Button>
          </div>
          {rows.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Max Marks</TableHead>
                  <TableHead>Obtained Marks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow
                    key={idx}
                    className={row.marks === null ? 'bg-red-50' : ''}
                  >
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.subject}</TableCell>
                    <TableCell>{row.maxMarks}</TableCell>
                    <TableCell>{row.marks ?? ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {rows.length > 0 && (
            <Button
              onClick={submitMarks}
              disabled={loading || hasBlankMarks}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              <Save className="h-4 w-4 mr-2" />
              Submit Marks
            </Button>
          )}
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

      <Dialog open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Template</DialogTitle>
            <DialogDescription>
              Select class details to generate marks template.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
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
              <Select
                value={subject}
                onValueChange={setSubject}
                disabled={!subjects.length}
              >
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDownloadModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDownloadTemplate}>Download</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarksUpload;

