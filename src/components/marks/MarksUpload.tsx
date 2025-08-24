import React, { useState, useRef } from 'react';
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
  rollNumber: string;
  section: string;
  year?: string;
  semester?: string;
  subject: string;
  maxMarks: number;
  marks: number | null;
}

interface ExcelRow {
  rollNumber: string | number;
  section: string | number;
  year: string | number;
  semester: string | number;
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const examTypeLabel =
    templateExam === 'mid1'
      ? 'Mid 1'
      : templateExam === 'mid2'
      ? 'Mid 2'
      : 'Mid 3';

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileLoading(true);
    const file = event.target.files?.[0];
    if (!file) {
      setFileLoading(false);
      return;
    }
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
          header: ['rollNumber', 'section', 'year', 'semester', 'subject', 'maxMarks', 'obtainedMarks'],
          range: 1,
        });

        const parsed: MarkRow[] = [];
        const invalidRollNumbers: string[] = [];
        const missingMarks: string[] = [];
        json.forEach((row) => {
          const rollNumber = row.rollNumber?.toString().trim();
          const section = row.section?.toString().trim();
          const year = row.year?.toString().trim();
          const semester = row.semester?.toString().trim();
          const subject = row.subject?.toString().trim();
          const maxMarks = Number(row.maxMarks);
          const marksStr = row.obtainedMarks?.toString().trim();
          const marks = marksStr === '' ? null : Number(marksStr);

          if (rollNumber && section && subject) {
            if (marks === null) {
              missingMarks.push(rollNumber);
              parsed.push({ rollNumber, section, year, semester, subject, maxMarks: Number(maxMarks), marks: null });
            } else if (Number.isNaN(marks) || Number.isNaN(maxMarks)) {
              invalidRollNumbers.push(rollNumber);
            } else {
              parsed.push({ rollNumber, section, year, semester, subject, maxMarks: Number(maxMarks), marks });
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
        if (invalidRollNumbers.length > 0) {
          const msg = `Invalid marks for: ${invalidRollNumbers.join(', ')}`;
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
          invalidRollNumbers.length === 0 &&
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
        setFileLoading(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read file');
      setIsParsing(false);
      setFileLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = async (exam: 'mid1' | 'mid2' | 'mid3') => {
    if (!templateYear || !templateSemester || !templateSection || !templateSubject) {
      toast.error('Please provide class details');
      return;
    }
    setDownloadLoading(true);
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

      const students: { rollNumber: string }[] = await res.json();

      const sheetData = students.map((s) => ({
        rollNumber: s.rollNumber,
        section: templateSection,
        year: templateYear,
        semester: templateSemester,
        subject: templateSubject,
        maxMarks: '',
        obtainedMarks: '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(sheetData, {
        header: ['rollNumber', 'section', 'year', 'semester', 'subject', 'maxMarks', 'obtainedMarks'],
      });
      if (worksheet['G1']) {
        worksheet['G1'].v = 'obtainedMarks (required)';
      }
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Marks');
      XLSX.writeFile(workbook, `marks_template_${exam}.xlsx`);
      setIsDownloadModalOpen(false);
      toast.success('Template downloaded successfully!');
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to fetch students');
    } finally {
      setDownloadLoading(false);
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
          {/* Responsive upload row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {/* File input, upload button, and file name */}
            <div className="flex flex-col sm:flex-row w-full items-stretch sm:items-center gap-2 flex-1">
              {/* File name, always visible and wraps on mobile */}
              <label
                htmlFor="marks-upload-input"
                className="block w-full sm:w-[220px] text-xs sm:text-sm text-gray-600 bg-[#f3f3f3] rounded px-2 py-1 cursor-pointer truncate"
                style={{
                  minHeight: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  wordBreak: 'break-all',
                }}
              >
                {uploadedFile?.name ? uploadedFile.name : 'No file chosen'}
              </label>
              {/* Upload button at right on desktop, full width on mobile */}
              <div className="flex w-full sm:w-auto">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  ref={fileInputRef}
                  disabled={fileLoading}
                  className="hidden"
                  id="marks-upload-input"
                />
                <Button
                  variant="outline"
                  className="w-full sm:w-auto flex items-center justify-center"
                  style={{ backgroundColor: THEME.accent, color: '#fff' }}
                  onClick={() => {
                    if (!fileLoading && fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  disabled={fileLoading}
                  type="button"
                >
                  {fileLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload
                </Button>
              </div>
            </div>
          </div>
          {uploadError && (
            <p className="text-red-500 text-sm">{uploadError}</p>
          )}
          {uploadSuccess && (
            <p className="text-green-500 text-sm">{uploadSuccess}</p>
          )}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-sm">{rowCount} rows uploaded</p>
            <Button
              onClick={submitMarks}
              disabled={loading || isParsing || rowCount === 0 || hasBlankMarks}
              style={{ backgroundColor: THEME.accent, color: '#fff' }}
              className="w-full sm:w-auto"
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

      {/* Small popup for loading file */}
      {fileLoading && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#8b0000] text-white px-4 py-2 rounded shadow-lg flex items-center z-50 text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Opening file manager...
        </div>
      )}

      {/* Small popup for downloading template */}
      {downloadLoading && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#8b0000] text-white px-4 py-2 rounded shadow-lg flex items-center z-50 text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Downloading template...
        </div>
      )}

      <Dialog open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen}>
        <DialogContent
          className="bg-[#fbf4ea] border-[#8b0000] rounded-lg"
          style={{ backgroundColor: THEME.bgBeige, borderColor: THEME.accent }}
        >
          <DialogHeader>
            <DialogTitle className="text-[#8b0000]">{`Download ${examTypeLabel} Template`}</DialogTitle>
            <DialogDescription className="text-[#a52a2a]">
              Select class details to generate {examTypeLabel} marks template.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-[#8b0000]">Year</label>
              <Select value={templateYear} onValueChange={setTemplateYear}>
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
              <label className="text-sm font-medium mb-2 block text-[#b86b2e]">Semester</label>
              <Select
                value={templateSemester}
                onValueChange={setTemplateSemester}
              >
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
              <label className="text-sm font-medium mb-2 block text-[#345b7a]">Section</label>
              <Select
                value={templateSection}
                onValueChange={setTemplateSection}
              >
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
              <label className="text-sm font-medium mb-2 block text-[#a52a2a]">Exam</label>
              <Select value={templateExam} onValueChange={setTemplateExam}>
                <SelectTrigger className="border-[#a52a2a] bg-[#fde8e6] text-[#a52a2a] font-semibold rounded-md">
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
              <label className="text-sm font-medium mb-2 block text-[#8b0000]">Subject</label>
              <Input
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
                placeholder="Subject Name"
                className="border-[#8b0000] bg-[#fde8e6] text-[#8b0000] font-semibold rounded-md"
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
              disabled={downloadLoading}
            >
              {downloadLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                'Download'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarksUpload;

