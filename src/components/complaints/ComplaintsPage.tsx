import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ComplaintForm from './ComplaintForm';
import ComplaintList from './ComplaintList';

const ComplaintsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/dashboard" replace />;
  }

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

export default ComplaintsPage;

