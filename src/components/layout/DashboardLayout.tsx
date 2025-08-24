import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  GraduationCap,
  LogOut,
  MessageSquare,
  Settings,
  Users,
  BookOpen,
  BarChart3,
  Calendar,
  FileText,
  Home,
  User,
  Clock,
  Bell,
  Menu,
  AlertCircle,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ChatSidebar from '@/components/chat/ChatSidebar';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProfileImageSrc } from '@/hooks/useProfileImageSrc';
import navVideo from '@/Assets/nav.mp4'; // Import your nav.mp4

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotifications] = useState(3);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const [chatOpen, setChatOpen] = useState(!isMobile);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const avatarSrc = useProfileImageSrc(user?.profileImage);

  useEffect(() => {
    setChatOpen(!isMobile);
  }, [isMobile]);

  const currentPage = location.pathname.split('/').pop() || 'dashboard';

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
          { id: 'users', label: 'User Management', icon: Users, path: '/dashboard/users' },
          { id: 'classes', label: 'Class Management', icon: BookOpen, path: '/dashboard/classes' },
          { id: 'subjects', label: 'Subject Management', icon: FileText, path: '/dashboard/subjects' },
          { id: 'timetable', label: 'Timetable', icon: Clock, path: '/dashboard/timetable' },
          { id: 'attendance', label: 'Attendance Manager', icon: Calendar, path: '/dashboard/attendance' },
          { id: 'marks', label: 'Marks', icon: BarChart3, path: '/dashboard/marks' },
          { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
          { id: 'announcements', label: 'Announcements', icon: Bell, path: '/dashboard/announcements' },
          { id: 'complaints', label: 'Complaints', icon: AlertCircle, path: '/dashboard/complaints' },
          { id: 'profile', label: 'Profile', icon: User, path: '/dashboard/profile' },
          { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
        ];
      case 'hod':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
          { id: 'classes', label: 'Class Management', icon: BookOpen, path: '/dashboard/classes' },
          { id: 'users', label: 'Faculty & Students', icon: Users, path: '/dashboard/users' },
          { id: 'subjects', label: 'Subject Management', icon: FileText, path: '/dashboard/subjects' },
          { id: 'analytics', label: 'Department Analytics', icon: BarChart3, path: '/dashboard/analytics' },
          { id: 'marks', label: 'Marks', icon: BarChart3, path: '/dashboard/marks' },
          { id: 'announcements', label: 'Announcements', icon: Bell, path: '/dashboard/announcements' },
          { id: 'complaints', label: 'Complaints', icon: AlertCircle, path: '/dashboard/complaints' },
          { id: 'profile', label: 'Profile', icon: User, path: '/dashboard/profile' },
          { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
        ];
      case 'professor':
        return [
          { id: 'professor', label: 'Dashboard', icon: Home, path: '/dashboard/professor' },
          { id: 'classes', label: 'Class Management', icon: BookOpen, path: '/dashboard/classes' },
          { id: 'marks', label: 'Marks', icon: BarChart3, path: '/dashboard/marks' },
          { id: 'attendance', label: 'Mark Attendance', icon: Calendar, path: '/dashboard/attendance' },
          { id: 'timetable', label: 'My Timetable', icon: Clock, path: '/dashboard/timetable' },
          { id: 'announcements', label: 'Announcements', icon: Bell, path: '/dashboard/announcements' },
          { id: 'profile', label: 'Profile', icon: User, path: '/dashboard/profile' },
          { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
        ];
      case 'student':
        return [
          { id: 'student', label: 'Dashboard', icon: Home, path: '/dashboard/student' },
          { id: 'my-marks', label: 'My Marks', icon: BarChart3, path: '/dashboard/my-marks' },
          { id: 'my-subjects', label: 'My Subjects', icon: BookOpen, path: '/dashboard/my-subjects' },
          { id: 'student-attendance', label: 'My Attendance', icon: Calendar, path: '/dashboard/student-attendance' },
          { id: 'timetable', label: 'My Timetable', icon: Clock, path: '/dashboard/timetable' },
          { id: 'resume', label: 'Resume', icon: FileText, path: '/dashboard/resume' },
          { id: 'contact-alumni', label: 'Contact Alumni', icon: GraduationCap, path: '/dashboard/contact-alumni' },
          { id: 'announcements', label: 'Announcements', icon: Bell, path: '/dashboard/announcements' },
          { id: 'profile', label: 'My Profile', icon: User, path: '/dashboard/profile' },
          { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
          { id: 'complaints', label: 'Complaint Box', icon: AlertCircle, path: '/dashboard/complaints' },
        ];
      case 'alumni':
        return [
          { id: 'alumni', label: 'Dashboard', icon: Home, path: '/dashboard/alumni' },
          { id: 'alumni-profile', label: 'My Profile', icon: User, path: '/dashboard/alumni/profile' },
          { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/dashboard/chat' },
          { id: 'announcements', label: 'Announcements', icon: Bell, path: '/dashboard/announcements' },
        ];
      default:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
          { id: 'profile', label: 'Profile', icon: User, path: '/dashboard/profile' },
        ];
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-gray-800'; // Muted black for professional look
      case 'hod': return 'bg-blue-700';
      case 'professor': return 'bg-green-700';
      case 'student': return 'bg-purple-700';
      case 'alumni': return 'bg-orange-700';
      default: return 'bg-gray-600';
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    setTouchStartX(null);
    setTouchStartY(null);

    if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

    if (window.innerWidth < 768) {
      const half = window.innerWidth / 2;
      if (!sidebarOpen && touchStartX > half && deltaX > 80 && Math.abs(deltaY) < 30) {
        setSidebarOpen(true);
      } else if (sidebarOpen && deltaX < -80 && Math.abs(deltaY) < 30) {
        setSidebarOpen(false);
      }
    }
  };

  const chatMargin = chatOpen ? (chatExpanded ? 'mr-80' : 'mr-16') : '';

  return (
    <SidebarProvider>
      {/* Sidebar: Hide on mobile when chat is open */}
      {!(isMobile && chatOpen) && (
        <Sidebar
          onMouseEnter={() => setSidebarOpen(true)}
          onMouseLeave={() => setSidebarOpen(false)}
          className={`fixed inset-y-0 left-0 z-40 border-r transition-[width] duration-300 overflow-hidden ${sidebarOpen ? 'w-60' : 'w-0 md:w-16'} bg-red-800 dark:bg-red-900`}
          collapsible="none"
        >
          <SidebarHeader className="border-b border-red-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              {sidebarOpen && (
                <div className="flex-1">
                  <h1 className="font-bold text-lg text-white">ECE Department</h1>
                  <p className="text-sm text-gray-200">Academic Portal</p>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className={`flex-1 ${sidebarOpen ? 'p-4' : 'p-2'} overflow-y-auto`}>
            {sidebarOpen && (
              <div className="mb-6">
                <div className="flex items-center gap-3 p-3 bg-red-700 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-white">{user?.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-white w-fit mt-1 ${getRoleBadgeColor(user?.role || '')}`}
                      >
                        {user?.role?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <SidebarMenu>
              {getMenuItems().map((item) => {
                const isActive = currentPage === item.id ||
                  (item.id === 'dashboard' && currentPage === 'dashboard') ||
                  (item.id === user?.role && currentPage === user?.role);

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.path)}
                      isActive={isActive}
                      className={`w-full ${sidebarOpen ? 'justify-start gap-3' : 'justify-center'}
                        text-white 
                        ${isActive ? 'bg-red-900 text-red-500' : 'hover:bg-red-700'}`}
                    >
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-red-500' : 'text-white'}`} />
                      {sidebarOpen && <span className={isActive ? 'text-red-500' : 'text-white'}>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <div className={`border-t border-red-700 ${sidebarOpen ? 'p-4' : 'p-2'}`}>
            <Button
              variant="ghost"
              onClick={logout}
              className={`w-full text-white hover:text-white hover:bg-red-700 ${sidebarOpen ? 'gap-3 justify-start' : 'justify-center'}`}
            >
              <LogOut className="h-5 w-5 text-white" />
              {sidebarOpen && <span className="text-white">Sign Out</span>}
            </Button>
          </div>
        </Sidebar>
      )}

      <div
        className={`min-h-screen flex flex-col w-full transition-all duration-300 ${sidebarOpen ? 'md:ml-60' : 'md:ml-16'} ml-0 ${chatMargin}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navbar: Hide on mobile when chat is open */}
        {!(isMobile && chatOpen) && (
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30in mobile if touches any side the opened side bar should close">
            <div className="relative flex h-12 md:h-24 items-center gap-2 md:gap-4 px-2 md:px-4 overflow-hidden ">
              {/* --- NAV VIDEO BACKGROUND --- */}
              <video
                src={navVideo}
                autoPlay
                muted
                playsInline
                className="
                  
                  absolute 
                  left-1/3 top-1/2
                  transform -translate-x-1/2 -translate-y-1/2
                  h-10 w-[30%]
                  md:h-full md:w-[65%]
                  object-cover
                  transition-all
                  
                "
                style={{
                  pointerEvents: 'none',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
              {/* --- NAV CONTENT (in front of video) --- */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden z-40"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
              <div className="flex-1 z-10" />

              {/* Chat Toggle */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newOpen = !chatOpen;
                    setChatOpen(newOpen);
                    setChatExpanded(newOpen);
                  }}
                  className="relative z-10"
                >
                  <MessageSquare className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
              )}

              {/* Notifications */}
              <div className="z-10">
                <NotificationDropdown />
              </div>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full z-10">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarSrc ?? '/placeholder.svg'} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`text-white w-fit mt-1 ${getRoleBadgeColor(user?.role || '')}`}
                      >
                        {user?.role?.toUpperCase()}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigation('/dashboard/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  {(user?.role === 'admin' || user?.role === 'hod') && (
                    <DropdownMenuItem onClick={() => handleNavigation('/dashboard/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
        )}

        <main className={`flex-1 p-0 transition-all duration-300`}>
          <Outlet />
        </main>
      </div>

      {/* Chat Sidebar: Always visible when open */}
      <ChatSidebar
        isOpen={chatOpen}
        expanded={chatExpanded}
        onToggle={() => {
          const newOpen = !chatOpen;
          setChatOpen(newOpen);
          setChatExpanded(newOpen);
        }}
        onExpandedChange={setChatExpanded}
      />

      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setSidebarOpen(false)}
          onTouchStart={() => setSidebarOpen(false)}
          style={{ background: 'transparent' }}
        />
      )}
    </SidebarProvider>
  );
};

export default DashboardLayout;