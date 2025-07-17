
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
      case 'attendance':
        return <AttendanceManager />;
      case 'profile':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your profile and preferences</p>
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Profile management coming soon...</p>
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
