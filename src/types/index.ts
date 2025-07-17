
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'hod' | 'professor' | 'student' | 'alumni';
  department?: string;
  year?: number;
  section?: string;
  rollNumber?: string;
  profileImage?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  parentContact?: string;
  bloodGroup?: string;
  admissionYear?: number;
  graduationYear?: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  year: number;
  semester: number;
  credits: number;
  professorId: string;
  professorName: string;
  type: 'theory' | 'lab' | 'elective';
  maxMarks: number;
}

export interface Attendance {
  id: string;
  studentId: string;
  subjectId: string;
  date: string;
  present: boolean;
  period: number;
  markedBy: string;
}

export interface InternalMark {
  id: string;
  studentId: string;
  subjectId: string;
  type: 'mid1' | 'mid2' | 'mid3' | 'assignment1' | 'assignment2' | 'assignment3';
  marks: number;
  maxMarks: number;
  date: string;
  enteredBy: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  chatType: 'section' | 'global';
  section?: string;
  attachments?: string[];
}

export interface Class {
  id: string;
  year: number;
  semester: number;
  section: string;
  hodId?: string;
  hodName?: string;
  subjects: Subject[];
  students: User[];
  totalStrength: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  targetRole?: string;
  targetSection?: string;
  targetYear?: number;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  attachments?: string[];
  isActive: boolean;
}

export interface AcademicRecord {
  id: string;
  studentId: string;
  year: number;
  semester: number;
  subjects: {
    subjectId: string;
    subjectName: string;
    credits: number;
    grade: string;
    marks: number;
    maxMarks: number;
  }[];
  sgpa: number;
  cgpa: number;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'academic' | 'sports' | 'cultural' | 'technical' | 'other';
  date: string;
  certificate?: string;
  verified: boolean;
}
