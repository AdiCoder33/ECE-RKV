import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { User } from '@/types';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface ImportUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportUsers: (
    users: (Omit<User, 'id'> & { password: string })[]
  ) => Promise<{
    inserted: number;
    updated: number;
    results: { index: number; action?: 'inserted' | 'updated'; error?: string }[];
  }>;
}

const ImportUsersModal: React.FC<ImportUsersModalProps> = ({ isOpen, onClose, onImportUsers }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [failedRows, setFailedRows] = useState<{ index: number; error: string }[]>([]);
  const [parsedData, setParsedData] = useState<(Omit<User, 'id'> & { password: string })[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setFile(selected || null);
    setRowErrors([]);
    setFailedRows([]);
    setParsedData([]);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 });

      const headers = rows[0]?.map((h) => String(h).trim());
      const required = ['Name', 'Email', 'Role', 'Password', 'Year', 'Section'];
      const missing = required.filter((h) => !headers?.includes(h));
      if (missing.length) {
        const message = `Missing required column(s): ${missing.join(', ')}`;
        console.error(message);
        toast.error(message);
        return;
      }

      const indexMap: Record<string, number> = {};
      headers.forEach((h, i) => {
        indexMap[h] = i;
      });

      const parsed = rows.slice(1).map((row) => ({
        name: String(row[indexMap['Name']] ?? ''),
        email: String(row[indexMap['Email']] ?? ''),
        role: String(row[indexMap['Role']] ?? ''),
        department: String(row[indexMap['Department']] ?? ''),
        year:
          row[indexMap['Year']] !== undefined && row[indexMap['Year']] !== ''
            ? Number(row[indexMap['Year']])
            : undefined,
        semester:
          row[indexMap['Semester']] !== undefined && row[indexMap['Semester']] !== ''
            ? (Number(row[indexMap['Semester']]) as 1 | 2)
            : undefined,
        section: String(row[indexMap['Section']] ?? ''),
        rollNumber: String(row[indexMap['RollNumber']] ?? ''),
        phone: String(row[indexMap['Phone']] ?? ''),
        password: String(row[indexMap['Password']] ?? '')
      }));

      const allowedRoles: User['role'][] = ['admin', 'hod', 'professor', 'student', 'alumni'];
      const validationErrors: string[] = [];
      parsed.forEach((u, idx) => {
        const errs: string[] = [];
        if (!Number.isInteger(u.year) || (u.year as number) <= 0) {
          errs.push('Year must be a positive integer');
        }
        if (u.semester !== undefined && u.semester !== 1 && u.semester !== 2) {
          errs.push('Semester must be 1 or 2');
        }
        if (!u.section.trim()) {
          errs.push('Section is required');
        }
        if (!u.rollNumber.trim()) {
          errs.push('Roll number is required');
        }
        if (!u.phone.trim()) {
          errs.push('Phone is required');
        }
        if (!allowedRoles.includes(u.role as User['role'])) {
          errs.push('Invalid role');
        }
        if (errs.length) {
          validationErrors.push(`Row ${idx + 2}: ${errs.join(', ')}`);
        }
      });

      if (validationErrors.length) {
        console.error('Validation errors:', validationErrors);
        setRowErrors(validationErrors);
        return;
      }

      setRowErrors([]);
      setParsedData(parsed);

      try {
        const { inserted, updated, results } = await onImportUsers(parsed);
        const total = inserted + updated;
        if (total > 0) {
          toast.success(`Inserted ${inserted} and updated ${updated} users`);
        }
        const failed = results.filter((r) => r.error) as {
          index: number;
          error: string;
        }[];
        setFailedRows(failed);
        if (failed.length) {
          toast.error(`${failed.length} rows failed to import`);
        } else {
          onClose();
        }
      } catch (err) {
        const message = (err as Error).message || 'Import failed';
        toast.error(message);
        throw err;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const downloadFailedCsv = () => {
    if (!failedRows.length) return;
    const data = failedRows.map((f) => ({
      Row: f.index + 2,
      Error: f.error,
      ...parsedData[f.index],
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'failed_rows.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-4 rounded-lg bg-[#fbf4ea] border-2 border-[#8b0000]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#8b0000]">
            <Upload className="h-5 w-5 text-[#8b0000]" />
            Import Users
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-[#a52a2a]">
            <FileSpreadsheet className="h-4 w-4" />
            Select an Excel (.xlsx) file to import users.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="border-[#8b0000] focus:border-[#a52a2a] focus:ring-[#a52a2a] bg-[#fffaf6]"
          />
          {rowErrors.length > 0 && (
            <div className="max-h-40 overflow-y-auto text-sm text-red-600 space-y-1 bg-red-50 border border-red-300 rounded p-2">
              <div className="flex items-center gap-2 mb-1 text-red-700 font-semibold">
                <AlertTriangle className="h-4 w-4" /> Import Errors
              </div>
              {rowErrors.map((err, idx) => (
                <p key={idx}>{err}</p>
              ))}
            </div>
          )}
          {failedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1 text-red-700 font-semibold">
                <AlertTriangle className="h-4 w-4" /> Failed Rows
              </div>
              <Table className="border border-red-300 bg-red-50 text-sm">
                <TableHeader>
                  <TableRow className="bg-red-100">
                    <TableHead>Row</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedRows.map((r) => (
                    <TableRow key={r.index}>
                      <TableCell>{r.index + 2}</TableCell>
                      <TableCell>{r.error}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button
                variant="outline"
                onClick={downloadFailedCsv}
                className="border-[#8b0000] text-[#8b0000] hover:bg-[#fde8e6] flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Download Failed Rows
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={importing}
            className="border-[#8b0000] text-[#8b0000] hover:bg-[#fde8e6]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="bg-[#8b0000] hover:bg-[#a52a2a] text-white flex items-center gap-2"
          >
            {importing ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Importing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportUsersModal;
