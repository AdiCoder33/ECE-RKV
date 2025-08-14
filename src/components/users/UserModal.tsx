import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from '@/types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialUser?: User;
  onSubmit: (user: Omit<User, 'id'> & { id?: string; password?: string }) => Promise<void>;
  error?: string | null;
}

const initialForm: Omit<User, 'id'> & { password: string } = {
  name: '',
  email: '',
  role: 'student',
  year: 1,
  semester: 1 as 1 | 2,
  section: 'A',
  rollNumber: '',
  phone: '',
  password: 'password',
};

const UserModal = ({ isOpen, onClose, mode, initialUser, onSubmit, error }: UserModalProps) => {
  const [formData, setFormData] = useState(initialForm);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialUser) {
        setFormData({
          ...initialForm,
          ...initialUser,
          year: initialUser.year ?? initialForm.year,
          semester: initialUser.semester ?? initialForm.semester,
          section: initialUser.section ?? initialForm.section,
          rollNumber: initialUser.rollNumber ?? initialForm.rollNumber,
          phone: initialUser.phone ?? initialForm.phone,
          password: '', // Don't prefill password on edit
        });
      } else {
        setFormData(initialForm);
      }
    }
  }, [isOpen, mode, initialUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.role === 'student' && formData.semester === undefined) {
      setValidationError('Semester is required');
      return;
    }
    setValidationError(null);

    try {
      // Only include id if editing and initialUser.id exists
      const payload: Omit<User, 'id'> & { id?: string; password?: string } = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        year: formData.role === 'student' ? formData.year : undefined,
        semester: formData.role === 'student' ? formData.semester : undefined,
        section: formData.role === 'student' ? formData.section : undefined,
        rollNumber: formData.role === 'student' ? formData.rollNumber : undefined,
        phone: formData.phone,
      };

      if (mode === 'add') {
        payload.password = formData.password;
      }
      if (mode === 'edit' && initialUser?.id) {
        payload.id = String(initialUser.id);
      }

      await onSubmit(payload);

      setFormData(initialForm);
      setValidationError(null);
    } catch {
      // error handled via prop
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            <span className="bg-gradient-to-r from-[#8b0000] via-[#a52a2a] to-[#b86b2e] bg-clip-text text-transparent">
              {mode === 'edit' ? 'Edit User' : 'Add New User'}
            </span>
          </DialogTitle>
          <DialogDescription className="text-[#a52a2a] font-medium">
            {mode === 'edit'
              ? 'Update user details for the ECE department.'
              : 'Create a new user account for the ECE department.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#8b0000] font-semibold">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                required
                className="border-[#8b0000] bg-[#fde8e6] text-[#8b0000] font-semibold rounded-md focus:border-[#a52a2a] focus:ring-[#a52a2a]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#8b0000] font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                required
                className="border-[#8b0000] bg-[#fde8e6] text-[#8b0000] font-semibold rounded-md focus:border-[#a52a2a] focus:ring-[#a52a2a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-[#8b0000] font-semibold">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger className="w-full border-[#8b0000] bg-[#fde8e6] text-[#8b0000] font-semibold rounded-md focus:border-[#a52a2a] focus:ring-[#a52a2a]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="hod">HOD</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[#345b7a] font-semibold">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className="border-[#345b7a] bg-[#e8f0fb] text-[#345b7a] font-semibold rounded-md focus:border-[#8b0000] focus:ring-[#8b0000]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#b86b2e] font-semibold">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Default is 'password'"
              className="border-[#b86b2e] bg-[#fff6e6] text-[#b86b2e] font-semibold rounded-md focus:border-[#8b0000] focus:ring-[#8b0000]"
            />
          </div>

          {formData.role === 'student' && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="year" className="text-[#345b7a] font-semibold">Year</Label>
                <Select
                  value={formData.year?.toString()}
                  onValueChange={(value) => handleInputChange('year', value ? parseInt(value) : value)}
                >
                  <SelectTrigger className="w-full border-[#345b7a] bg-[#e8f0fb] text-[#345b7a] font-semibold rounded-md focus:border-[#8b0000] focus:ring-[#8b0000]">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester" className="text-[#b86b2e] font-semibold">Semester</Label>
                <Select
                  value={formData.semester?.toString()}
                  onValueChange={(value) => handleInputChange('semester', value ? (parseInt(value) as 1 | 2) : value)}
                >
                  <SelectTrigger className="w-full border-[#b86b2e] bg-[#fff6e6] text-[#b86b2e] font-semibold rounded-md focus:border-[#8b0000] focus:ring-[#8b0000]">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section" className="text-[#b86b2e] font-semibold">Section</Label>
                <Input
                  id="section"
                  value={formData.section}
                  onChange={(e) => handleInputChange('section', e.target.value)}
                  placeholder="A, B, C..."
                  className="border-[#b86b2e] bg-[#fff6e6] text-[#b86b2e] font-semibold rounded-md focus:border-[#8b0000] focus:ring-[#8b0000]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rollNumber" className="text-[#8b0000] font-semibold">Roll Number</Label>
                <Input
                  id="rollNumber"
                  value={formData.rollNumber}
                  onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                  placeholder="e.g., 20ECE001"
                  className="border-[#6b0f0f] bg-[#fde8e6] text-[#8b0000] font-semibold rounded-md focus:border-[#a52a2a] focus:ring-[#a52a2a]"
                />
              </div>
            </div>
          )}

          {(error || validationError) && (
            <p className="text-red-500 text-sm">{validationError ?? error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-[#8b0000] text-[#8b0000] hover:bg-[#fde8e6]">
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#8b0000] via-[#a52a2a] to-[#b86b2e] text-white font-bold hover:from-[#a52a2a] hover:via-[#b86b2e] hover:to-[#8b0000] rounded-md"
            >
              {mode === 'edit' ? 'Save Changes' : 'Add User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserModal;

