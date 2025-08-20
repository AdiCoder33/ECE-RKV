import React, { useState } from 'react';
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
import { toast } from 'sonner';
import { Upload, Download, Save, Loader2 } from 'lucide-react';
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

interface ExcelRow {
  email: string | number;
  subject: string;
  maxMarks: string | number;
  obtainedMarks: string | number;
}

const apiBase = import.meta.env.VITE_API_URL || '/api';

// Theme colors consistent with Class Management
const THEME = {
  bgBeige: '#fbf4ea',
  accent: '#8b0000',
};

const MarksUpload = () => {
  const [rows, setRows] = useState<MarkRow[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [hasBlankMarks, setHasBlankMarks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Class information used for generating templates
  const [templateYear, setTemplateYear] = useState('');
  const [templateSemester, setTemplateSemester] = useState('');
  const [templateSection, setTemplateSection] = useState('');
  const [templateExam, setTemplateExam] = useState<'mid1' | 'mid2' | 'mid3'>('mid1');
  const [templateSubject, setTemplateSubject] = useState('');

  const examTypeLabel =
    templateExam === 'mid1'
      ? 'Mid 1'
      : templateExam === 'mid2'
      ? 'Mid 2'
      : 'Mid 3';

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setIsParsing(true);
    setUploadError(null);
    setUploadSuccess(null);

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
        setRowCount(parsed.length);
        setHasBlankMarks(missingMarks.length > 0);
        if (parsed.length > 0) {
          toast.success(`Uploaded ${parsed.length} rows`);
        }
        const errors: string[] = [];
        if (invalidEmails.length > 0) {
          const msg = `Invalid marks for: ${invalidEmails.join(', ')}`;
          toast.error(msg);
          errors.push(msg);
        }
        if (missingMarks.length > 0) {
          const msg = `Missing obtained marks for: ${missingMarks.join(', ')}`;
          toast.error(msg);
          errors.push(msg);
        }
        if (
          parsed.length === 0 &&
          invalidEmails.length === 0 &&
          missingMarks.length === 0
        ) {
          const msg = 'No valid rows found';
          toast.error(msg);
          errors.push(msg);
        }
        setUploadError(errors.length > 0 ? errors.join(' ') : null);
      } catch (error) {
        const message = (error as Error).message;
        toast.error(message);
        setRowCount(0);
        setUploadError(message);
      } finally {
        input.value = '';
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read file');
      setIsParsing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = async (exam: 'mid1' | 'mid2' | 'mid3') => {
    if (!templateYear || !templateSemester || !templateSection || !templateSubject) {
      toast.error('Please provide class details');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${apiBase}/students?year=${templateYear}&semester=${templateSemester}&section=${templateSection}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? 'Failed to fetch students');
        return;
      }

      const students: { email: string }[] = await res.json();

      const sheetData = students.map((s) => ({
        email: s.email,
        subject: templateSubject,
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
      XLSX.writeFile(workbook, `marks_template_${exam}.xlsx`);
      setIsDownloadModalOpen(false);
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to fetch students');
    }
  };

  const submitMarks = async () => {
    if (rowCount === 0) {
      toast.error('Please upload marks file first');
      return;
    }

    if (rows.some((r) => r.marks === null)) {
      toast.error('Please fill in all obtained marks before submitting');
      return;
    }

    try {
      setLoading(true);

      const examTypeMatch = uploadedFile?.name.toLowerCase().match(/mid[123]/);
      const examType = (examTypeMatch ? examTypeMatch[0] : 'mid1') as
        | 'mid1'
        | 'mid2'
        | 'mid3';

      const response = await fetch(`${apiBase}/marks/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          type: examType,
          date: new Date().toISOString(),
          marksData: rows,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        const baseMessage =
          err.error ||
          (Array.isArray(err.errors)
            ? err.errors.join(', ')
            : 'Failed to submit marks');
        toast.error(`${baseMessage} (${response.status})`);
        setUploadSuccess(null);
        return;
      }

      toast.success('Marks submitted successfully!');
      setUploadError(null);
      setRows([]);
      setHasBlankMarks(false);
      setUploadedFile(null);
      setRowCount(0);
      setUploadSuccess('Marks submitted successfully!');
    } catch (error) {
      console.error('Error submitting marks:', error);
      toast.error((error as Error).message || 'Failed to submit marks');
      setUploadSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="space-y-6 px-4 sm:px-6 md:px-0"
      style={{ backgroundColor: THEME.bgBeige }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold" style={{ color: THEME.accent }}>
          Marks Upload
        </h1>
        <Button
          onClick={() => setIsDownloadModalOpen(true)}
          style={{ backgroundColor: THEME.accent, color: '#fff' }}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Marks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="pr-24"
            />
            <Button
              variant="outline"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ backgroundColor: THEME.accent, color: '#fff' }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
          {uploadError && (
            <p className="text-red-500 text-sm">{uploadError}</p>
          )}
          {uploadSuccess && (
            <p className="text-green-500 text-sm">{uploadSuccess}</p>
          )}
          <div className="flex justify-between items-center">
            <p>{rowCount} rows uploaded</p>
            <Button
              onClick={submitMarks}
              disabled={loading || isParsing || rowCount === 0 || hasBlankMarks}
              style={{ backgroundColor: THEME.accent, color: '#fff' }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Submit Marks
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download {examTypeLabel} Template</DialogTitle>
            <DialogDescription>
              Select class details to generate {examTypeLabel} marks template.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={templateYear} onValueChange={setTemplateYear}>
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
              <Select
                value={templateSemester}
                onValueChange={setTemplateSemester}
              >
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
              <Select
                value={templateSection}
                onValueChange={setTemplateSection}
              >
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
              <label className="text-sm font-medium mb-2 block">Exam</label>
              <Select value={templateExam} onValueChange={setTemplateExam}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mid1">Mid 1</SelectItem>
                  <SelectItem value="mid2">Mid 2</SelectItem>
                  <SelectItem value="mid3">Mid 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Input
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
                placeholder="Subject Name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDownloadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleDownloadTemplate(templateExam)}
              style={{ backgroundColor: THEME.accent, color: '#fff' }}
            >
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarksUpload;

