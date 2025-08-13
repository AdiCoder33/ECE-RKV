import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactElement;
}

const NonStudentRoute: React.FC<Props> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'student') {
    return <Navigate to="/dashboard/student" replace />;
  }
  return children;
};

export default NonStudentRoute;
