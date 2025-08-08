import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, User, Phone, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  phone?: string;
  dateOfBirth?: string;
  attendancePercentage: number;
  cgpa: number;
  profileImage?: string;
}

interface Class {
  id: string;
  year: number;
  section: string;
  totalStrength: number;
}

const ClassStudents = () => {
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const { classId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [classData, setClassData] = useState<Class | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassData();
    fetchStudents();
  }, [fetchClassData, fetchStudents]);

  const fetchClassData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/classes/${classId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch class data');
      }
      const data: Class = await response.json();
      setClassData(data);
    } catch (error) {
      console.error('Error fetching class data:', error);
      toast.error('Failed to fetch class data');
    }
  }, [apiBase, classId]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/classes/${classId}/students`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data: Student[] = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [apiBase, classId]);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttendanceBadge = (percentage: number) => {
    if (percentage >= 85) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (percentage >= 75) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  const getGPABadge = (gpa: number) => {
    if (gpa >= 8.5) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (gpa >= 7.0) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  const handleStudentClick = (studentId: string) => {
    navigate(`/dashboard/students/${studentId}`);
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-6 md:px-0">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading students...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 md:px-0 md:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/dashboard/classes')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {classData ? `Year ${classData.year} - Section ${classData.section}` : 'Class Students'}
            </h1>
            <p className="text-muted-foreground">
              {filteredStudents.length} of {students.length} students
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No students found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search criteria' : 'No students enrolled in this class'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={student.profileImage} />
                    <AvatarFallback>
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">{student.rollNumber}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{student.email}</span>
                  </div>
                  {student.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                  {student.dateOfBirth && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(student.dateOfBirth).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getAttendanceBadge(student.attendancePercentage)}>
                    {student.attendancePercentage}% Attendance
                  </Badge>
                  <Badge className={getGPABadge(student.cgpa)}>
                    {student.cgpa} CGPA
                  </Badge>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleStudentClick(student.id)}
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassStudents;