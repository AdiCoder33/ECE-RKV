import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ComplaintForm from '@/components/complaints/ComplaintForm';
import ComplaintList from '@/components/complaints/ComplaintList';
import { THEME } from '@/theme';
import { Megaphone, Users, ShieldAlert } from 'lucide-react';

const ComplaintsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/dashboard" replace />;
  }

  const renderContent = () => {
    switch (user.role) {
      case 'student':
        return <ComplaintForm />;
      case 'admin':
      case 'hod':
        return <ComplaintList />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  };

  // Header icon based on role
  const getHeaderIcon = () => {
    if (user.role === 'student') return <Megaphone className="h-7 w-7 text-[#8b0000] mr-2" />;
    if (user.role === 'admin') return <ShieldAlert className="h-7 w-7 text-[#8b0000] mr-2" />;
    if (user.role === 'hod') return <Users className="h-7 w-7 text-[#8b0000] mr-2" />;
    return null;
  };

  // Header text based on role
  const getHeaderText = () => {
    if (user.role === 'student') return "Submit a Complaint";
    if (user.role === 'admin' || user.role === 'hod') return "Manage Complaints";
    return "Complaints";
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-2 sm:px-4 md:px-8 py-6"
      style={{ backgroundColor: THEME.bgBeige }}
    >
      <div className="w-full max-w-2xl mx-auto mb-6">
        <div className="flex items-center gap-2 mb-2">
          {getHeaderIcon()}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#8b0000] tracking-tight">
            {getHeaderText()}
          </h1>
        </div>
        <p className="text-[#b86b2e] text-sm sm:text-base mb-2">
          {user.role === 'student'
            ? "If you have any issues or grievances, please submit your complaint below. Our team will address it promptly."
            : "View and manage all complaints submitted by students. Please address them in a timely and professional manner."
          }
        </p>
        <div className="border-b border-[#fde8e6] mb-4" />
      </div>
      <div className="w-full max-w-2xl">
        {renderContent()}
      </div>
    </div>
  );
};

export default ComplaintsPage;

