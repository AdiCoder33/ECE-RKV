
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

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
}

const AddSubjectModal = ({ isOpen, onClose, onAddSubject }: AddSubjectModalProps) => {
  const [formData, setFormData] = useState<Omit<Subject, 'id'>>({
    name: '',
    code: '',
    year: 1,
    semester: 1 as 1 | 2,
    credits: 1,
    professorId: '',
    professorName: '',
    type: 'theory',
    maxMarks: 100
  });

  const professors = [
    { id: '1', name: 'Prof. John Doe' },
    { id: '2', name: 'Prof. Priya Sharma' },
    { id: '3', name: 'Prof. Amit Kumar' },
    { id: '4', name: 'Prof. Neha Gupta' },
    { id: '5', name: 'Prof. Ravi Patel' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedProfessor = professors.find(p => p.id === formData.professorId);
    if (!selectedProfessor) return;

    onAddSubject({
      ...formData,
      professorName: selectedProfessor.name
    });

    // Reset form
    setFormData({
      name: '',
      code: '',
      year: 1,
      semester: 1 as 1 | 2,
      credits: 1,
      professorId: '',
      professorName: '',
      type: 'theory',
      maxMarks: 100
    });

    onClose();
  };

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Subject</DialogTitle>
          <DialogDescription>
            Create a new subject for the ECE department.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Digital Signal Processing"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Subject Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="e.g., ECE301"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <select
                id="year"
                value={formData.year}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                className="w-full p-2 border rounded-md bg-background"
                required
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <select
                id="semester"
                value={formData.semester}
                onChange={(e) => handleInputChange('semester', parseInt(e.target.value) as 1 | 2)}
                className="w-full p-2 border rounded-md bg-background"
                required
              >
                {[1, 2].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                min={1}
                max={6}
                value={formData.credits}
                onChange={(e) => handleInputChange('credits', parseInt(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
                required
              >
                <option value="theory">Theory</option>
                <option value="lab">Lab</option>
                <option value="elective">Elective</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMarks">Max Marks</Label>
              <Input
                id="maxMarks"
                type="number"
                min={50}
                max={100}
                value={formData.maxMarks}
                onChange={(e) => handleInputChange('maxMarks', parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="professor">Assign Professor</Label>
            <select
              id="professor"
              value={formData.professorId}
              onChange={(e) => handleInputChange('professorId', e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
              required
            >
              <option value="">Select Professor</option>
              {professors.map(prof => (
                <option key={prof.id} value={prof.id}>{prof.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Type:</span>
            <Badge className={
              formData.type === 'theory' ? 'bg-blue-100 text-blue-800' :
              formData.type === 'lab' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }>
              {formData.type}
            </Badge>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Subject
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubjectModal;
