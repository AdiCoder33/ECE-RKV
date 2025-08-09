import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Subject } from '@/types';

interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditSubject: (id: string, subject: Omit<Subject, 'id'>) => void;
  subject: Subject | null;
}

const EditSubjectModal: React.FC<EditSubjectModalProps> = ({ 
  isOpen, 
  onClose, 
  onEditSubject, 
  subject 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    year: 1,
    semester: 1,
    credits: 3,
    professorId: '',
    professorName: '',
    type: 'theory' as 'theory' | 'lab' | 'elective',
    maxMarks: 100
  });

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name,
        code: subject.code,
        year: subject.year,
        semester: subject.semester,
        credits: subject.credits,
        professorId: subject.professorId,
        professorName: subject.professorName,
        type: subject.type,
        maxMarks: subject.maxMarks
      });
    }
  }, [subject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject) {
      onEditSubject(subject.id, formData);
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!subject) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>
            Update the subject information below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="col-span-3"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="col-span-3"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">Year</Label>
            <Select
              value={formData.year.toString()}
              onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1st Year</SelectItem>
                <SelectItem value="2">2nd Year</SelectItem>
                <SelectItem value="3">3rd Year</SelectItem>
                <SelectItem value="4">4th Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="semester" className="text-right">Semester</Label>
            <Select
              value={formData.semester.toString()}
              onValueChange={(value) => setFormData({ ...formData, semester: parseInt(value) })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1st Semester</SelectItem>
                <SelectItem value="2">2nd Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="credits" className="text-right">Credits</Label>
            <Input
              id="credits"
              type="number"
              min="1"
              max="6"
              value={formData.credits}
              onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
              className="col-span-3"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as 'theory' | 'lab' | 'elective' })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="theory">Theory</SelectItem>
                <SelectItem value="lab">Lab</SelectItem>
                <SelectItem value="elective">Elective</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxMarks" className="text-right">Max Marks</Label>
            <Input
              id="maxMarks"
              type="number"
              min="25"
              max="100"
              value={formData.maxMarks}
              onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) })}
              className="col-span-3"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="professorName" className="text-right">Professor</Label>
            <Input
              id="professorName"
              value={formData.professorName}
              onChange={(e) => setFormData({ ...formData, professorName: e.target.value })}
              className="col-span-3"
              placeholder="Professor name"
              required
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Update Subject</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSubjectModal;