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
      } else if (initialUser?.id) {
        payload.id = initialUser.id;
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
          <DialogTitle>{mode === 'edit' ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update user details for the ECE department.'
              : 'Create a new user account for the ECE department.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
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
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Default is 'password'"
            />
          </div>

          {formData.role === 'student' && (
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select
                  value={formData.year?.toString()}
                  onValueChange={(value) =>
                    handleInputChange('year', value ? parseInt(value) : value)
                  }
                >
                  <SelectTrigger>
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
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={formData.semester?.toString()}
                  onValueChange={(value) =>
                    handleInputChange('semester', value ? (parseInt(value) as 1 | 2) : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={formData.section}
                  onChange={(e) => handleInputChange('section', e.target.value)}
                  placeholder="A, B, C..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input
                  id="rollNumber"
                  value={formData.rollNumber}
                  onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                  placeholder="e.g., 20ECE001"
                />
              </div>
            </div>
          )}

          {(error || validationError) && (
            <p className="text-red-500 text-sm">{validationError ?? error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'edit' ? 'Save Changes' : 'Add User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserModal;

