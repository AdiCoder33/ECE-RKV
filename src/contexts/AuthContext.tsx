
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
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
  const apiBase = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    // Check for stored authentication
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User & { profile_image?: string };
        if (typeof parsed.id === 'number') {
          if ('profile_image' in parsed) {
            parsed.profileImage = parsed.profile_image;
            delete parsed.profile_image;
          }
          localStorage.setItem('user', JSON.stringify(parsed));
          setUser(parsed);
        }
      } catch {
        // ignore invalid stored user
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    // Clear any previous auth data to avoid using stale IDs
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    const response = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    const { token, user: userInfo } = data;
    const normalizedUserInfo = { ...userInfo } as typeof userInfo & {
      profile_image?: string;
      profileImage?: string;
    };
    if ('profile_image' in normalizedUserInfo) {
      normalizedUserInfo.profileImage = normalizedUserInfo.profile_image;
      delete normalizedUserInfo.profile_image;
    }

    const id = Number(normalizedUserInfo.id);
    if (typeof id !== 'number' || Number.isNaN(id)) {
      throw new Error('Invalid user ID');
    }
    const sanitizedUser: User = { ...normalizedUserInfo, id };

    setUser(sanitizedUser);
    // Only persist the user if the ID is a valid number
    localStorage.setItem('user', JSON.stringify(sanitizedUser));
    localStorage.setItem('token', token);

    // Redirect based on role
    const dashboardRoutes = {
      admin: '/dashboard',
      hod: '/dashboard',
      professor: '/dashboard/professor',
      student: '/dashboard/student',
      alumni: '/dashboard/alumni'
    } as const;

    window.location.href = dashboardRoutes[userInfo.role as keyof typeof dashboardRoutes];
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
