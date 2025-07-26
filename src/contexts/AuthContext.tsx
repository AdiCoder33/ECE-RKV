
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', email);
      
      // Mock authentication for demo
      const mockUsers: User[] = [
        { id: '1', email: 'admin@college.edu', name: 'Admin User', role: 'admin', department: 'ECE' },
        { id: '2', email: 'hod@college.edu', name: 'Dr. Smith', role: 'hod', department: 'ECE' },
        { id: '3', email: 'prof@college.edu', name: 'Prof. Johnson', role: 'professor', department: 'ECE' },
        { id: '4', email: 'student@college.edu', name: 'John Doe', role: 'student', department: 'ECE', year: 3, section: 'A', rollNumber: '20EC001' },
        { id: '5', email: 'alumni@college.edu', name: 'Jane Smith', role: 'alumni', department: 'ECE', graduationYear: 2020 }
      ];

      const foundUser = mockUsers.find(u => u.email === email);
      if (foundUser && password === 'password') {
        console.log('Login successful for user:', foundUser);
        setUser(foundUser);
        localStorage.setItem('user', JSON.stringify(foundUser));
        
        // Redirect based on role
        const dashboardRoutes = {
          admin: '/dashboard',
          hod: '/dashboard',
          professor: '/dashboard/professor',
          student: '/dashboard/student',
          alumni: '/dashboard/alumni'
        };
        
        window.location.href = dashboardRoutes[foundUser.role as keyof typeof dashboardRoutes];
        return true;
      }
      console.log('Login failed: Invalid credentials');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
