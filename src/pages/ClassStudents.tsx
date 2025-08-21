import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, User, Phone, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import loaderMp4 from '@/Assets/loader.mp4';

const apiBase = import.meta.env.VITE_API_URL || '/api';

// ECE theme colors
const THEME = {
  bgBeige: '#fbf4ea',
  accent: '#8b0000',
  cardBg: 'bg-white',
  cardShadow: 'shadow-lg',
  textMuted: 'text-gray-600'
};

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

interface StudentResponse {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  rollNumber?: string;
  roll_number?: string;
  phone?: string;
  dateOfBirth?: string;
  date_of_birth?: string;
  attendancePercentage?: number;
  attendance_percentage?: number;
  cgpa?: number;
  gpa?: number;
  profileImage?: string;
}

interface Class {
  id: string;
  year: number;
  section: string;
  totalStrength: number;
}

// Loader component using loader.mp4
const Loader = () => (
  <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
    <video
      src={loaderMp4}
      autoPlay
      loop
      muted
      playsInline
      className="w-32 h-32 object-contain mb-4 rounded-lg shadow-lg"
      aria-label="Loading animation"
    />
    <div className="font-semibold text-lg tracking-wide text-[#8b0000]">Loading Students...</div>
    <div className="text-sm mt-1 text-[#a52a2a]">Fetching student data, please wait</div>
  </div>
);

const ClassStudents = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [classData, setClassData] = useState<Class | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClassData();
    fetchStudents();
    // eslint-disable-next-line
  }, [classId]);

  const fetchClassData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/classes/${classId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch class data');
      }
      const data = await res.json();
      setClassData({
        id: data.id || data._id || classId!,
        year: data.year,
        section: data.section,
        totalStrength: data.totalStrength || data.total_strength || 0
      });
    } catch (error) {
      console.error('Error fetching class data:', error);
      toast.error('Failed to fetch class data');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/classes/${classId}/students`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch students');
      }
      const data: StudentResponse[] = await res.json();
      const mapped: Student[] = data.map((s) => ({
        id: s.id || s._id || '',
        name: s.name,
        email: s.email,
        rollNumber: s.rollNumber || s.roll_number || '',
        phone: s.phone,
        dateOfBirth: s.dateOfBirth || s.date_of_birth,
        attendancePercentage: s.attendancePercentage ?? s.attendance_percentage ?? 0,
        cgpa: s.cgpa ?? s.gpa ?? 0,
        profileImage: s.profileImage
      }));
      setStudents(mapped);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students');
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="min-h-screen w-full px-0 sm:px-0 py-0" style={{ background: THEME.bgBeige }}>
        <Loader />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{ background: THEME.bgBeige }}
    >
      <div className="w-full max-w-6xl space-y-6 px-2 sm:px-4 py-4 sm:py-6 md:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/classes')}
              className="shrink-0 border-[#8b0000] text-[#8b0000] hover:bg-[#8b0000] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#8b0000]">
                {classData ? `Year ${classData.year} - Section ${classData.section}` : 'Class Students'}
              </h1>
              <p className="text-gray-600">
                {filteredStudents.length} of {students.length} students
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Students Grid */}
        {filteredStudents.length === 0 ? (
          <Card className={`${THEME.cardBg} ${THEME.cardShadow}`}>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-[#8b0000]">
                {error ? 'Failed to load students' : 'No students found'}
              </h3>
              <p className="text-gray-600">
                {error ? 'Please try again later.' : searchTerm ? 'Try adjusting your search criteria' : 'No students enrolled in this class'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <Card
                key={student.id}
                className={`${THEME.cardBg} ${THEME.cardShadow} hover:shadow-xl transition-shadow cursor-pointer`}
                onClick={() => handleStudentClick(student.id)}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={student.profileImage} />
                      <AvatarFallback>
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate text-[#8b0000]">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.rollNumber}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    {student.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{student.phone}</span>
                      </div>
                    )}
                    {student.dateOfBirth && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(student.dateOfBirth).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={getAttendanceBadge(student.attendancePercentage)}>
                      {student.attendancePercentage}% Attendance
                    </Badge>
                    <Badge className={getGPABadge(student.cgpa)}>
                      {student.cgpa} CGPA
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassStudents;
