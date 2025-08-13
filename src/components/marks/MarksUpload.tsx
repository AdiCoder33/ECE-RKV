import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Upload, Download, Save } from 'lucide-react';

interface MarkRow {
  email: string;
  subject: string;
  maxMarks: number;
  obtainedMarks: number;
}

const MarksUpload = () => {
  const [rows, setRows] = useState<MarkRow[]>([]);
  const [loading, setLoading] = useState(false);

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split(/\r?\n/).filter(Boolean);
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const emailIdx = headers.indexOf('email');
        const subjectIdx = headers.indexOf('subject');
        const maxIdx = headers.indexOf('maxmarks');
        const obtainedIdx = headers.indexOf('obtainedmarks');

        const data: MarkRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',');
          const email = row[emailIdx]?.trim();
          const subject = row[subjectIdx]?.trim();
          const maxMarks = parseFloat(row[maxIdx]);
          const obtainedMarks = parseFloat(row[obtainedIdx]);

          if (email && subject && !isNaN(maxMarks) && !isNaN(obtainedMarks)) {
            data.push({ email, subject, maxMarks, obtainedMarks });
          }
        }

        setRows(data);
        toast.success(`Uploaded ${data.length} rows`);
      } catch (error) {
        toast.error('Error parsing Excel file');
      }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
  };

  const downloadTemplate = () => {
    const csvContent = 'email,subject,maxMarks,obtainedMarks\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marks_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const submitMarks = async () => {
    if (rows.length === 0) {
      toast.error('Please upload marks file first');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/marks/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ marks: rows })
      });

      if (response.ok) {
        toast.success('Marks submitted successfully!');
        setRows([]);
      } else {
        toast.error('Failed to submit marks');
      }
    } catch (error) {
      toast.error('Failed to submit marks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Marks Upload
        </h1>
        <Button variant="outline" onClick={downloadTemplate}>
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
            <Button
              onClick={submitMarks}
              disabled={loading}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              <Save className="h-4 w-4 mr-2" />
              Submit Marks
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarksUpload;

