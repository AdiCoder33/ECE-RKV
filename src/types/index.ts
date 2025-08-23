
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'hod' | 'professor' | 'student' | 'alumni';
  department?: string;
  year?: number;
  semester?: 1 | 2;
  section?: string;
  rollNumber?: string;
  profileImage?: string;
  phone?: string;
  createdAt?: string;
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
  semester: 1 | 2;
  credits: number;
  type: 'theory' | 'lab' | 'elective';
}

export interface Attendance {
  id: string;
  studentId: number;
  subjectId: string;
  date: string;
  present: boolean;
  period: number;
  markedBy: number;
}

export interface InternalMark {
  id: string;
  studentId: number;
  subjectId: string;
  type: 'mid1' | 'mid2' | 'mid3' | 'assignment1' | 'assignment2' | 'assignment3';
  marks: number;
  maxMarks: number;
  date: string;
  enteredBy: number;
}

export interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  groupId?: string;
  receiverId?: number;
  sender_profileImage?: string;
  attachments?: Attachment[];
}

export interface PrivateMessage {
  id: string;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  sender_name: string;
  message_type: string;
  is_read: number;
  delivered_at?: string | null;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  sender_profileImage?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  url: string;
  type: 'image' | 'file';
  name: string;
  progress?: number;
}

export interface Class {
  id: string;
  year: number;
  semester: 1 | 2;
  section: string;
  hodId?: number;
  hodName?: string;
  subjects: Subject[];
  students: User[];
  totalStrength: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: number;
  authorName: string;
  targetRole?: string;
  targetSection?: string;
  targetYear?: number;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  attachments?: string[];
  isActive: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  user_id: number;
  data?: Record<string, unknown>;
}

export interface AcademicRecord {
  id: string;
  studentId: number;
  year: number;
  semester: 1 | 2;
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
  userId: number;
  title: string;
  description: string;
  category: 'academic' | 'sports' | 'cultural' | 'technical' | 'other';
  date: string;
  certificate?: string;
  verified: boolean;
}

export interface Complaint {
  id: number;
  studentId: number;
  studentName: string;
  type: 'facilities' | 'faculty' | 'general';
  title: string;
  description: string;
  isAnonymous: boolean;
  createdAt: string;
}
