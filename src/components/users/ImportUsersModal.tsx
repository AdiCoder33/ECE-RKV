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
  ) => Promise<{ success: number; errors: string[] }>;
}

const ImportUsersModal: React.FC<ImportUsersModalProps> = ({ isOpen, onClose, onImportUsers }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setFile(selected || null);
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
        toast.error(`Missing required column(s): ${missing.join(', ')}`);
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
        section: String(row[indexMap['Section']] ?? ''),
        rollNumber: String(row[indexMap['RollNumber']] ?? ''),
        phone: String(row[indexMap['Phone']] ?? ''),
        password: String(row[indexMap['Password']] ?? '')
      }));

      const { success, errors } = await onImportUsers(parsed);
      if (success > 0) {
        toast.success(`Successfully imported ${success} users`);
        onClose();
      }
      errors.forEach((e) => toast.error(e));
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
