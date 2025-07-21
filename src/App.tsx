
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './contexts/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginForm from './components/auth/LoginForm';
import Homepage from './pages/Homepage';
import AdminDashboard from './components/dashboard/AdminDashboard';
import StudentDashboard from './components/dashboard/StudentDashboard';
import ProfessorDashboard from './components/dashboard/ProfessorDashboard';
import AlumniDashboard from './components/dashboard/AlumniDashboard';
import UserManagement from './components/users/UserManagement';
import ClassManagement from './components/classes/ClassManagement';
import SubjectManagement from './components/subjects/SubjectManagement';
import AttendanceManager from './components/attendance/AttendanceManager';
import Analytics from './components/analytics/Analytics';
import Announcements from './components/announcements/Announcements';
import Profile from './components/profile/Profile';
import Settings from './components/settings/Settings';
import './App.css';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
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
                <Route path="classes" element={<ClassManagement />} />
                <Route path="subjects" element={<SubjectManagement />} />
                <Route path="attendance" element={<AttendanceManager />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
