
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  GraduationCap, 
  LogOut, 
  Menu, 
  MessageSquare, 
  Settings,
  Users,
  BookOpen,
  BarChart3,
  Calendar,
  FileText,
  Home,
  User
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset
} from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  currentPage, 
  onPageChange 
}) => {
  const { user, logout } = useAuth();
  const [unreadNotifications] = useState(3);

  const getMenuItems = () => {
    const commonItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'chat', label: 'Chat', icon: MessageSquare },
    ];

    switch (user?.role) {
      case 'admin':
        return [
          ...commonItems,
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'classes', label: 'Class Management', icon: BookOpen },
          { id: 'subjects', label: 'Subject Management', icon: FileText },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'announcements', label: 'Announcements', icon: Bell },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'hod':
        return [
          ...commonItems,
          { id: 'classes', label: 'Classes', icon: BookOpen },
          { id: 'professors', label: 'Professors', icon: Users },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'announcements', label: 'Announcements', icon: Bell },
        ];
      case 'professor':
        return [
          ...commonItems,
          { id: 'classes', label: 'My Classes', icon: BookOpen },
          { id: 'attendance', label: 'Attendance', icon: Calendar },
          { id: 'marks', label: 'Internal Marks', icon: BarChart3 },
          { id: 'students', label: 'Students', icon: Users },
        ];
      case 'student':
        return [
          ...commonItems,
          { id: 'subjects', label: 'My Subjects', icon: BookOpen },
          { id: 'attendance', label: 'My Attendance', icon: Calendar },
          { id: 'marks', label: 'My Performance', icon: BarChart3 },
          { id: 'announcements', label: 'Announcements', icon: Bell },
        ];
      case 'alumni':
        return [
          ...commonItems,
          { id: 'records', label: 'Academic Records', icon: FileText },
          { id: 'achievements', label: 'Achievements', icon: BarChart3 },
          { id: 'network', label: 'Alumni Network', icon: Users },
        ];
      default:
        return commonItems;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-600';
      case 'hod': return 'bg-blue-600';
      case 'professor': return 'bg-green-600';
      case 'student': return 'bg-purple-600';
      case 'alumni': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r">
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h1 className="font-bold text-lg">DepartmentConnect</h1>
                <p className="text-sm text-muted-foreground">Academic Portal</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="flex-1 p-4">
            <div className="mb-6">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user?.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-white ${getRoleBadgeColor(user?.role || '')}`}
                    >
                      {user?.role?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <SidebarMenu>
              {getMenuItems().map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onPageChange(item.id)}
                    isActive={currentPage === item.id}
                    className="w-full justify-start gap-3"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    {item.id === 'chat' && unreadNotifications > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <div className="border-t p-4">
            <Button 
              variant="ghost" 
              onClick={logout}
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger className="md:hidden" />
              <div className="flex-1" />
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>
            </div>
          </header>
          
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
