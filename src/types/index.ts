
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
}

export interface Attendance {
  id: string;
  studentId: string;
  subjectId: string;
  date: string;
  present: boolean;
  period: number;
}

export interface InternalMark {
  id: string;
  studentId: string;
  subjectId: string;
  type: 'mid1' | 'mid2' | 'mid3' | 'assignment1' | 'assignment2' | 'assignment3';
  marks: number;
  maxMarks: number;
  date: string;
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
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  targetRole?: string;
  targetSection?: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}
