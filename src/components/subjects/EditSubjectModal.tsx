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
  onEditSubject: (id: string, subject: Omit<Subject, 'id'>) => Promise<void>;
  subject: Subject | null;
}

const EditSubjectModal: React.FC<EditSubjectModalProps> = ({
  isOpen,
  onClose,
  onEditSubject,
  subject
}) => {
  const [formData, setFormData] = useState<Omit<Subject, 'id'>>({
    name: '',
    code: '',
    year: 1,
    semester: 1 as 1 | 2,
    credits: 3,
    type: 'theory'
  });

  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(false);

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name,
        code: subject.code,
        year: subject.year,
        semester: subject.semester,
        credits: subject.credits,
        type: subject.type
      });
    }
  }, [subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject) {
      setLoading(true);
      await onEditSubject(subject.id, formData);
      setLoading(false);
      setPopup(true);
      setTimeout(() => setPopup(false), 2000);
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!subject) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px] bg-stone-100 dark:bg-gray-950 text-gray-900 dark:text-stone-100 rounded-lg shadow-xl">
          <DialogHeader className="p-4 border-b border-stone-300 dark:border-gray-800">
            <DialogTitle className="text-2xl font-bold text-red-800 dark:text-red-400">Edit Subject</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Update the subject information below.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 p-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right font-medium">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3 border-stone-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right font-medium">Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="col-span-3 border-stone-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right font-medium">Year</Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
              >
                <SelectTrigger className="col-span-3 border-stone-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="semester" className="text-right font-medium">Semester</Label>
              <Select
                value={formData.semester.toString()}
                onValueChange={(value) => setFormData({ ...formData, semester: parseInt(value) as 1 | 2 })}
              >
                <SelectTrigger className="col-span-3 border-stone-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  <SelectItem value="1">1st Semester</SelectItem>
                  <SelectItem value="2">2nd Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="credits" className="text-right font-medium">Credits</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                max="6"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                className="col-span-3 border-stone-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right font-medium">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as 'theory' | 'lab' | 'elective' })}
              >
                <SelectTrigger className="col-span-3 border-stone-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  <SelectItem value="theory">Theory</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                  <SelectItem value="elective">Elective</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter className="mt-6 bg-stone-200 dark:bg-gray-800 p-4 rounded-b-lg">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-200"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-red-700 text-white hover:bg-red-800 transition-colors duration-200 flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>Update Subject</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Popup for success */}
      {popup && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-2 rounded shadow-lg text-sm font-semibold">
          Subject updated successfully!
        </div>
      )}
    </>
  );
};

export default EditSubjectModal;