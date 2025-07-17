
import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import ProfessorDashboard from '@/components/dashboard/ProfessorDashboard';
import AttendanceManager from '@/components/attendance/AttendanceManager';
import UserManagement from '@/components/users/UserManagement';
import ClassManagement from '@/components/classes/ClassManagement';
import SubjectManagement from '@/components/subjects/SubjectManagement';
import Analytics from '@/components/analytics/Analytics';
import Announcements from '@/components/announcements/Announcements';
import Profile from '@/components/profile/Profile';
import Settings from '@/components/settings/Settings';

const queryClient = new QueryClient();

const MainApp = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        switch (user.role) {
          case 'admin':
          case 'hod':
            return <AdminDashboard />;
          case 'professor':
            return <ProfessorDashboard />;
          case 'student':
          case 'alumni':
            return <StudentDashboard />;
          default:
            return <AdminDashboard />;
        }
      case 'users':
        return <UserManagement />;
      case 'classes':
        return <ClassManagement />;
      case 'subjects':
        return <SubjectManagement />;
      case 'attendance':
        return <AttendanceManager />;
      case 'analytics':
        return <Analytics />;
      case 'announcements':
        return <Announcements />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      // Student-specific pages
      case 'marks':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">My Performance</h1>
            <p className="text-muted-foreground">View your academic performance and grades</p>
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Performance dashboard coming soon...</p>
            </div>
          </div>
        );
      case 'students':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">My Students</h1>
            <p className="text-muted-foreground">Manage and view student information</p>
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Student management coming soon...</p>
            </div>
          </div>
        );
      case 'professors':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Faculty Management</h1>
            <p className="text-muted-foreground">Manage department faculty and professors</p>
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Faculty management coming soon...</p>
            </div>
          </div>
        );
      case 'records':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Academic Records</h1>
            <p className="text-muted-foreground">View your complete academic history</p>
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Academic records coming soon...</p>
            </div>
          </div>
        );
      case 'achievements':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">My Achievements</h1>
            <p className="text-muted-foreground">Showcase your accomplishments and awards</p>
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Achievements showcase coming soon...</p>
            </div>
          </div>
        );
      case 'network':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Alumni Network</h1>
            <p className="text-muted-foreground">Connect with fellow alumni and expand your network</p>
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Alumni network coming soon...</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">{currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}</h1>
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">This feature is coming soon...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </DashboardLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <MainApp />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
