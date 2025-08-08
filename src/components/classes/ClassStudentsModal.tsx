import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, User, Mail, Phone, Calendar, GraduationCap } from 'lucide-react';
import { Class, User as UserType } from '@/types';
import { toast } from 'sonner';

interface ClassStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class | null;
  onStudentClick: (studentId: string) => void;
}

const ClassStudentsModal = ({ isOpen, onClose, classData, onStudentClick }: ClassStudentsModalProps) => {
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<(UserType & { attendance: number; gpa: number })[]>([]);

  useEffect(() => {
    if (!classData || !isOpen) return;

    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiBase}/classes/${classData.id}/students`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }
        const data: (UserType & { attendance: number; gpa: number })[] = await response.json();
        setStudents(data);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to fetch students');
      }
    };

    fetchStudents();
  }, [classData, isOpen]);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttendanceBadge = (attendance: number) => {
    if (attendance >= 90) return 'bg-green-600 text-white';
    if (attendance >= 75) return 'bg-yellow-600 text-white';
    return 'bg-red-600 text-white';
  };

  const getGPABadge = (gpa: number) => {
    if (gpa >= 8.5) return 'bg-green-600 text-white';
    if (gpa >= 7.0) return 'bg-yellow-600 text-white';
    return 'bg-red-600 text-white';
  };

  if (!classData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Students in Class {classData.year}-{classData.section}
          </DialogTitle>
          <DialogDescription>
            ECE {classData.year}{classData.year === 1 ? 'st' : classData.year === 2 ? 'nd' : classData.year === 3 ? 'rd' : 'th'} Year, Section {classData.section} • {filteredStudents.length} Students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name, roll number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Students List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onStudentClick(student.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{student.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {student.rollNumber}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {student.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {student.phone}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Attendance:</span>
                        <Badge className={getAttendanceBadge(student.attendance)}>
                          {student.attendance}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">GPA:</span>
                        <Badge className={getGPABadge(student.gpa)}>
                          {student.gpa}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-1" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No students found matching your search.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClassStudentsModal;