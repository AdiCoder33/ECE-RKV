
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  User,
  ChevronLeft,
  ChevronRight
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ChatSidebar from '@/components/chat/ChatSidebar';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const getMenuItems = () => {
    const commonItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'profile', label: 'Profile', icon: User },
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
        <Sidebar className={`border-r transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1">
                  <h1 className="font-bold text-lg">DepartmentConnect</h1>
                  <p className="text-sm text-muted-foreground">Academic Portal</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-8 w-8"
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="flex-1 p-4">
            {!sidebarCollapsed && (
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
            )}

            <SidebarMenu>
              {getMenuItems().map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onPageChange(item.id)}
                    isActive={currentPage === item.id}
                    className={`w-full justify-start gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}
                    tooltip={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <div className="border-t p-4">
            <Button 
              variant="ghost" 
              onClick={logout}
              className={`w-full gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 ${sidebarCollapsed ? 'justify-center' : 'justify-start'}`}
              title={sidebarCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-5 w-5" />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </Button>
          </div>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <div className="flex-1" />
              
              {/* Chat Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setChatOpen(!chatOpen)}
                className="relative"
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

              {/* Notifications */}
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

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
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
                  <DropdownMenuItem onClick={() => onPageChange('profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className={`flex-1 p-6 transition-all duration-300 ${chatOpen ? 'mr-80' : ''}`}>
            {children}
          </main>
        </SidebarInset>

        {/* Chat Sidebar */}
        <ChatSidebar isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
