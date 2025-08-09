import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { User } from '@/types';

interface ImportUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportUsers: (
    users: (Omit<User, 'id'> & { password: string })[]
  ) => Promise<{ inserted: number; updated: number; errors: string[] }>;
}

const ImportUsersModal: React.FC<ImportUsersModalProps> = ({ isOpen, onClose, onImportUsers }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [rowErrors, setRowErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setFile(selected || null);
    setRowErrors([]);
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
      const required = ['Name', 'Email', 'Role', 'Password'];
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
            ? Number(row[indexMap['Semester']])
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
        if (!Number.isInteger(u.semester) || (u.semester as number) <= 0) {
          errs.push('Semester must be a positive integer');
        }
        if (u.role === 'student' && u.semester !== undefined && u.semester !== 1 && u.semester !== 2) {
          errs.push('Semester must be 1 or 2 for student role');
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

      try {
        const { inserted, updated, errors } = await onImportUsers(parsed);
        const total = inserted + updated;
        if (total > 0) {
          toast.success(`Inserted ${inserted} and updated ${updated} users`);
          onClose();
        }
        errors.forEach((e) => toast.error(e));
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Users</DialogTitle>
          <DialogDescription>Select an Excel (.xlsx) file to import users.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input type="file" accept=".xlsx" onChange={handleFileChange} />
          {rowErrors.length > 0 && (
            <div className="max-h-40 overflow-y-auto text-sm text-red-600 space-y-1">
              {rowErrors.map((err, idx) => (
                <p key={idx}>{err}</p>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={importing}>Cancel</Button>
          <Button onClick={handleImport} disabled={!file || importing}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportUsersModal;
