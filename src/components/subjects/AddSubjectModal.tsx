// src/components/AddSubjectModal.jsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Subject } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubject: (subject: Omit<Subject, 'id'>) => Promise<void>;
}

const AddSubjectModal = ({ isOpen, onClose, onAddSubject }: AddSubjectModalProps) => {
  const [formData, setFormData] = useState<Omit<Subject, 'id'>>({
    name: '',
    code: '',
    year: 1,
    semester: 1 as 1 | 2,
    credits: 1,
    type: 'theory'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await onAddSubject(formData);

    // Reset form
    setFormData({
      name: '',
      code: '',
      year: 1,
      semester: 1 as 1 | 2,
      credits: 1,
      type: 'theory'
    });

    onClose();
  };

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'theory': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'lab': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'elective': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-stone-100 dark:bg-gray-950 text-gray-900 dark:text-stone-100 rounded-lg shadow-xl">
        <DialogHeader className="p-4 border-b border-stone-300 dark:border-gray-800">
          <DialogTitle className="text-2xl font-bold text-red-800 dark:text-red-400">Add New Subject</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Create a new subject for the ECE department.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium">Subject Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Digital Signal Processing"
                className="border-stone-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code" className="font-medium">Subject Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="e.g., ECE301"
                className="border-stone-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year" className="font-medium">Year</Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(value) => handleInputChange('year', parseInt(value))}
              >
                <SelectTrigger className="w-full border-stone-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Select a year" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester" className="font-medium">Semester</Label>
              <Select
                value={formData.semester.toString()}
                onValueChange={(value) => handleInputChange('semester', parseInt(value) as 1 | 2)}
              >
                <SelectTrigger className="w-full border-stone-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credits" className="font-medium">Credits</Label>
              <Input
                id="credits"
                type="number"
                min={1}
                max={6}
                value={formData.credits}
                onChange={(e) => handleInputChange('credits', parseInt(e.target.value))}
                className="border-stone-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="font-medium">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger className="w-full border-stone-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  <SelectItem value="theory">Theory</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                  <SelectItem value="elective">Elective</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Type Preview:</span>
            <Badge className={getTypeColor(formData.type)}>
              {formData.type}
            </Badge>
          </div>

          <DialogFooter className="mt-6 bg-stone-200 dark:bg-gray-800 p-4 rounded-b-lg">
            <Button type="button" variant="outline" onClick={onClose} className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-200">
              Cancel
            </Button>
            <Button type="submit" className="bg-red-700 text-white hover:bg-red-800 transition-colors duration-200">
              Add Subject
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubjectModal;