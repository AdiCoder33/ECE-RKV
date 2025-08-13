
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginForm from './components/auth/LoginForm';
import Homepage from './pages/Homepage';
import StudentProfile from './components/profile/StudentProfile';
import StudentAttendance from './pages/StudentAttendance';
import AdminDashboard from './components/dashboard/AdminDashboard';
import StudentDashboard from './components/dashboard/StudentDashboard';
import ProfessorDashboard from './components/dashboard/ProfessorDashboard';
import AlumniDashboard from './components/dashboard/AlumniDashboard';
import UserManagement from './components/users/UserManagement';
import GroupManagement from './components/groups/GroupManagement';
import TimetableRouter from './components/timetable/TimetableRouter';
import ClassManagement from './components/classes/ClassManagement';
import ClassStudents from './pages/ClassStudents';
import SubjectManagement from './components/subjects/SubjectManagement';
import StudentSubjects from './components/subjects/StudentSubjects';
import AttendanceManager from './components/attendance/AttendanceManager';
import Analytics from './components/analytics/Analytics';
import Announcements from './components/announcements/Announcements';
import Profile from './components/profile/Profile';
import Settings from './components/settings/Settings';
import AlumniDirectory from './pages/AlumniDirectory';
import AlumniProfile from './components/profile/AlumniProfile';
import ContactAlumni from './pages/ContactAlumni';
import ResumeBuilder from './components/profile/ResumeBuilder';
import StudentMarks from './components/marks/StudentMarks';
import MarksUpload from './components/marks/MarksUpload';
import MarksOverview from './components/marks/MarksOverview';
import NonStudentRoute from './components/auth/NonStudentRoute';
import ChatList from './components/chat/ChatList';
import ChatConversation from './components/chat/ChatConversation';
import './App.css';

// Create a client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <ChatProvider>
            <Router>
              <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="student" element={<StudentDashboard />} />
                  <Route path="professor" element={<ProfessorDashboard />} />
                  <Route path="alumni" element={<AlumniDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="groups" element={<GroupManagement />} />
                  <Route path="timetable" element={<TimetableRouter />} />
                  <Route path="classes" element={<ClassManagement />} />
                  <Route path="classes/:classId/students" element={<ClassStudents />} />
                  <Route path="subjects" element={<SubjectManagement />} />
                  <Route path="my-subjects" element={<StudentSubjects />} />
                  <Route path="attendance" element={<AttendanceManager />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="announcements" element={<Announcements />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="profile/student/:studentId" element={<StudentProfile studentId="" />} />
                  <Route path="students/:studentId" element={<StudentProfile studentId="" />} />
                  <Route path="student-attendance" element={<StudentAttendance />} />
                  <Route path="alumni" element={<AlumniDirectory />} />
                  <Route path="alumni/profile" element={<AlumniProfile />} />
                  <Route path="contact-alumni" element={<ContactAlumni />} />
                  <Route path="resume" element={<ResumeBuilder />} />
                  <Route path="my-marks" element={<StudentMarks />} />
                  <Route
                    path="marks-overview"
                    element={
                      <NonStudentRoute>
                        <MarksOverview />
                      </NonStudentRoute>
                    }
                  />
                  <Route path="marks-upload" element={<MarksUpload />} />
                  <Route path="chat" element={<ChatList />} />
                  <Route path="chat/:type/:id" element={<ChatConversation />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </div>
            </Router>
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
