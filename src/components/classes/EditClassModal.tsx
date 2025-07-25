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
import { Class } from '@/types';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditClass: (id: string, classData: Omit<Class, 'id'>) => void;
  classData: Class | null;
}

const EditClassModal: React.FC<EditClassModalProps> = ({ 
  isOpen, 
  onClose, 
  onEditClass, 
  classData 
}) => {
  const [formData, setFormData] = useState({
    year: 1,
    semester: 1,
    section: 'A',
    subjects: [],
    students: [],
    totalStrength: 0
  });

  useEffect(() => {
    if (classData) {
      setFormData({
        year: classData.year,
        semester: classData.semester,
        section: classData.section,
        subjects: classData.subjects,
        students: classData.students,
        totalStrength: classData.totalStrength
      });
    }
  }, [classData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (classData) {
      onEditClass(classData.id, formData);
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!classData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
          <DialogDescription>
            Update the class information below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">Year</Label>
            <Select
              value={formData.year.toString()}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                year: parseInt(value),
                semester: parseInt(value) * 2 - 1 // Auto-calculate semester
              })}
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
            <Input
              id="semester"
              type="number"
              value={formData.semester}
              className="col-span-3"
              disabled
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="section" className="text-right">Section</Label>
            <Select
              value={formData.section}
              onValueChange={(value) => setFormData({ ...formData, section: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Section A</SelectItem>
                <SelectItem value="B">Section B</SelectItem>
                <SelectItem value="C">Section C</SelectItem>
                <SelectItem value="D">Section D</SelectItem>
                <SelectItem value="E">Section E</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Update Class</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClassModal;