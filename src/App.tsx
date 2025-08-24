import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { Toaster } from '@/components/ui/sonner';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginForm from './components/auth/LoginForm';
import ForgotPassword from './components/auth/ForgotPassword';
import Homepage from './pages/Homepage';
import StudentAttendance from './pages/StudentAttendance';
import AdminDashboard from './components/dashboard/AdminDashboard';
import StudentDashboard from './components/dashboard/StudentDashboard';
import ProfessorDashboard from './components/dashboard/ProfessorDashboard';
import AlumniDashboard from './components/dashboard/AlumniDashboard';
import UserManagement from './components/users/UserManagement';
import GroupManagement from './components/groups/GroupManagement';
import TimetableRouter from './components/timetable/TimetableRouter';
import ClassManagement from './components/classes/ClassManagement';
import ClassStudents from './pages/ClassStudents';
import SubjectManagement from './components/subjects/SubjectManagement';
import StudentSubjects from './components/subjects/StudentSubjects';
import AttendanceManager from './components/attendance/AttendanceManager';
import Analytics from './components/analytics/Analytics';
import Announcements from './components/announcements/Announcements';
import Profile from './components/profile/Profile';
import Settings from './components/settings/Settings';
import AlumniDirectory from './pages/AlumniDirectory';
import AlumniProfile from './components/profile/AlumniProfile';
import ContactAlumni from './pages/ContactAlumni';
import ResumeBuilder from './components/profile/ResumeBuilder';
import StudentMarks from './components/marks/StudentMarks';
import Marks from './components/marks/Marks';
import ChatList from './components/chat/ChatList';
import ChatConversation from './components/chat/ChatConversation';
import StudentProfile from './components/profile/StudentProfile';
import ComplaintsPage from './components/complaints/ComplaintsPage';
import Intro from './pages/Intro';
import introductionVideo from '@/Assets/intro.mp4';
import { isPWAStandalone } from '@/utils/isPWA';
import './App.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function StandaloneRedirector() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone && location.pathname === '/') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser) as { role?: string };
          const dashboardRoutes = {
            admin: '/dashboard',
            hod: '/dashboard',
            professor: '/dashboard/professor',
            student: '/dashboard/student',
            alumni: '/dashboard/alumni',
          } as const;
          if (parsed.role && parsed.role in dashboardRoutes) {
            navigate(
              dashboardRoutes[parsed.role as keyof typeof dashboardRoutes],
              { replace: true }
            );
            return;
          }
        } catch {
          // ignore invalid stored user
        }
      }
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  return null;
}

// Create a client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
});

const App: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const isStandalone = isPWAStandalone();
    const alreadyShown = localStorage.getItem('introVideoShown');
    if (isMobile && isStandalone && !alreadyShown) {
      setShowIntro(true);
    }
  }, []);

  const handleIntroEnd = () => {
    setShowIntro(false);
    localStorage.setItem('introVideoShown', '1');
  };

  if (showIntro) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        <div className="w-full h-full flex items-center justify-center">
          <video
            src={introductionVideo}
            autoPlay
            playsInline
            muted={false}
            controls={false}
            className="object-contain scale-75 w-full h-full bg-black"
            onEnded={handleIntroEnd}
          />
        </div>
      </div>
    );
  }

  return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Router>
            <StandaloneRedirector />
            <AuthProvider>
              <ChatProvider>
                <div className="min-h-screen bg-background">
                {deferredPrompt && (
                  <button
                    onClick={() => {
                      deferredPrompt.prompt();
                      deferredPrompt.userChoice.finally(() => setDeferredPrompt(null));
                    }}
                  >
                    Install App
                  </button>
                )}
                <Toaster />
                <Routes>
                  <Route path="/" element={<Homepage />} />
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/intro" element={<Intro />} />
                  <Route path="/dashboard" element={<DashboardLayout />}> 
                  <Route index element={<AdminDashboard />} />
                  <Route path="student" element={<StudentDashboard />} />
                  <Route path="professor" element={<ProfessorDashboard />} />
                  <Route path="alumni" element={<AlumniDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="groups" element={<GroupManagement />} />
                  <Route path="timetable" element={<TimetableRouter />} />
                  <Route path="classes" element={<ClassManagement />} />
                  <Route path="classes/:classId/students" element={<ClassStudents />} />
                  <Route path="subjects" element={<SubjectManagement />} />
                  <Route path="my-subjects" element={<StudentSubjects />} />
                  <Route path="attendance" element={<AttendanceManager />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="announcements" element={<Announcements />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="student-attendance" element={<StudentAttendance />} />
                  <Route path="alumni" element={<AlumniDirectory />} />
                  <Route path="alumni/profile" element={<AlumniProfile />} />
                  <Route path="contact-alumni" element={<ContactAlumni />} />
                  <Route path="complaints" element={<ComplaintsPage />} />
                  <Route path="resume" element={<ResumeBuilder />} />
                  <Route path="my-marks" element={<StudentMarks />} />
                  <Route path="students/:studentId" element={<StudentProfile />} />
                  <Route path="marks" element={<Marks />} />
                  <Route path="chat" element={<ChatList />} />
                  <Route path="chat/:type/:id" element={<ChatConversation />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                </Routes>
              </div>
              </ChatProvider>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
  );
}

export default App;
