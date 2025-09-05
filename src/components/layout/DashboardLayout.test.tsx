// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

const mockUseChat = { conversations: [] as { unreadCount: number }[] };

vi.mock('@/contexts/ChatContext', () => ({
  useChat: () => mockUseChat,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Alice', role: 'student', profileImage: null }, logout: vi.fn() }),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => true,
}));

vi.mock('@/hooks/useProfileImageSrc', () => ({
  useProfileImageSrc: () => null,
}));

vi.mock('@/components/notifications/NotificationDropdown', () => ({
  default: () => <div />,
}));

vi.mock('@/components/chat/ChatSidebar', () => ({
  default: () => null,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/dashboard' }),
  Outlet: () => <div />,
}));

vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Sidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({ children, ...props }: { children: React.ReactNode }) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <div />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import DashboardLayout from './DashboardLayout';

afterEach(() => {
  cleanup();
});

describe('DashboardLayout unread badge', () => {
  it('sums unread counts from conversations', () => {
    mockUseChat.conversations = [{ unreadCount: 2 }, { unreadCount: 5 }];
    render(<DashboardLayout />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('hides badge when no unread messages', () => {
    mockUseChat.conversations = [{ unreadCount: 0 }, { unreadCount: 0 }];
    render(<DashboardLayout />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
