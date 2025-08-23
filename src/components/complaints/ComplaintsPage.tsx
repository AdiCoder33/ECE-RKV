import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ComplaintForm from '@/components/complaints/ComplaintForm';
import ComplaintList from '@/components/complaints/ComplaintList';
import { THEME } from '@/theme';

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

  return (
    <div style={{ backgroundColor: THEME.bgBeige }}>
      {renderContent()}
    </div>
  );
};

export default ComplaintsPage;

