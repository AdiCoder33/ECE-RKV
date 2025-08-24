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
  actionLoading?: boolean;
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

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialUser,
  onSubmit,
  error,
  actionLoading
}) => {
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
      <DialogContent className="max-w-md w-full p-4 rounded-lg bg-[#fbf4ea] border-2 border-[#8b0000]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#8b0000]">
            {mode === 'edit' ? 'Edit User' : 'Add User'}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-[#8b0000] mb-1">Full Name</label>
            <Input
              type="text"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              required
              placeholder="Enter full name"
              className="w-full border-[#8b0000] focus:border-[#a52a2a] focus:ring-[#a52a2a] bg-[#fffaf6]"
            />
          </div>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#8b0000] mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              required
              placeholder="Enter email"
              className="w-full border-[#8b0000] focus:border-[#a52a2a] focus:ring-[#a52a2a] bg-[#fffaf6]"
            />
          </div>
          {/* Password */}
          {mode === 'add' && (
            <div>
              <label className="block text-sm font-medium text-[#8b0000] mb-1">Password</label>
              <Input
                type="password"
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                required
                placeholder="Enter password"
                className="w-full border-[#8b0000] focus:border-[#a52a2a] focus:ring-[#a52a2a] bg-[#fffaf6]"
              />
            </div>
          )}
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-[#8b0000] mb-1">Phone</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              placeholder="Enter phone number"
              className="w-full border-[#8b0000] focus:border-[#a52a2a] focus:ring-[#a52a2a] bg-[#fffaf6]"
            />
          </div>
          {/* Roll Number and Section side by side */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#8b0000] mb-1">Roll Number</label>
              <Input
                type="text"
                value={formData.rollNumber}
                onChange={e => handleInputChange('rollNumber', e.target.value)}
                placeholder="Enter roll number"
                className="w-full border-[#8b0000] focus:border-[#a52a2a] focus:ring-[#a52a2a] bg-[#fffaf6]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#8b0000] mb-1">Section</label>
              <Input
                type="text"
                value={formData.section}
                onChange={e => handleInputChange('section', e.target.value)}
                placeholder="Section"
                className="w-full border-[#8b0000] focus:border-[#a52a2a] focus:ring-[#a52a2a] bg-[#fffaf6]"
              />
            </div>
          </div>
          {/* Role, Year, Semester side by side */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#8b0000] mb-1">Role</label>
              <select
                value={formData.role}
                onChange={e => handleInputChange('role', e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md text-sm border-[#8b0000] focus:border-[#a52a2a] focus:ring-[#a52a2a] bg-[#fde8e6] text-[#8b0000]"
              >
                <option value="">Select role</option>
                <option value="student">Student</option>
                <option value="professor">Professor</option>
                <option value="hod">HOD</option>
                <option value="alumni">Alumni</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex-1 flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#8b0000] mb-1">Year</label>
                <select
                  value={formData.year?.toString()}
                  onChange={e => handleInputChange('year', e.target.value ? parseInt(e.target.value) : e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm border-[#8b0000] focus:border-[#a52a2a] focus:ring-[#a52a2a] bg-[#e8f0fb] text-[#345b7a]"
                >
                  <option value="">Year</option>
                  <option value="1">1st</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#8b0000] mb-1">Semester</label>
                <select
                  value={formData.semester?.toString()}
                  onChange={e => handleInputChange('semester', e.target.value ? (parseInt(e.target.value) as 1 | 2) : e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm border-[#8b0000] focus:border-[#a52a2a] focus:ring-[#a52a2a] bg-[#fff6e6] text-[#b86b2e]"
                >
                  <option value="">Sem</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </div>
            </div>
          </div>
          {/* Error */}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4 border-[#8b0000] text-[#8b0000] hover:bg-[#fde8e6]"
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#8b0000] hover:bg-[#a52a2a] text-white px-4"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                mode === 'edit' ? 'Update User' : 'Add User'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserModal;

