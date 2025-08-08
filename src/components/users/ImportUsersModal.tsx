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
  onAddUser: (user: Omit<User, 'id'> & { password: string }) => Promise<void>;
}

const ImportUsersModal: React.FC<ImportUsersModalProps> = ({ isOpen, onClose, onAddUser }) => {
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
      const parsed = rows.slice(1).map((row) => ({
        name: String(row[0] ?? ''),
        email: String(row[1] ?? ''),
        role: String(row[2] ?? ''),
        year: row[3] !== undefined && row[3] !== '' ? Number(row[3]) : undefined,
        section: String(row[4] ?? ''),
        rollNumber: String(row[5] ?? ''),
        phone: String(row[6] ?? ''),
        password: String(row[7] ?? '')
      }));

      let success = 0;
      const errors: string[] = [];
      for (let i = 0; i < parsed.length; i++) {
        try {
          await onAddUser(parsed[i]);
          success++;
        } catch (err) {
          errors.push(`Row ${i + 2}: ${(err as Error).message}`);
        }
      }

      if (success > 0) {
        toast.success(`Successfully imported ${success} users`);
      }
      errors.forEach((e) => toast.error(e));
    } finally {
      setImporting(false);
      onClose();
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
