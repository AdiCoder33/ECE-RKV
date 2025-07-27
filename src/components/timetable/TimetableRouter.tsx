import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TimetableManagement from './TimetableManagement';
import ProfessorTimetable from './ProfessorTimetable';
import StudentTimetable from './StudentTimetable';

const TimetableRouter = () => {
  const { user } = useAuth();

  // Route to appropriate timetable component based on user role
  switch (user?.role) {
    case 'admin':
    case 'hod':
      return <TimetableManagement />;
    case 'professor':
      return <ProfessorTimetable />;
    case 'student':
      return <StudentTimetable />;
    default:
      return <div>Access denied</div>;
  }
};

export default TimetableRouter;