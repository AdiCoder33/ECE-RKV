// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

const mockFetchConversation = vi.fn();
const mockToast = vi.fn();
const mockUseChat = {
  conversations: [] as any[],
  fetchConversations: vi.fn().mockResolvedValue([]),
  fetchConversation: mockFetchConversation,
  fetchMoreConversation: vi.fn(),
  fetchGroupMessages: vi.fn(),
  fetchMoreGroupMessages: vi.fn(),
  privateMessages: [],
  messages: [],
  sendDirectMessage: vi.fn(),
  sendGroupMessage: vi.fn(),
  markAsRead: vi.fn(),
  pinConversation: vi.fn(),
  fetchGroups: vi.fn().mockResolvedValue([]),
  onlineUsers: new Set<number>(),
  typingUsers: new Set<number>(),
  setTyping: vi.fn(),
  searchUsers: vi.fn().mockResolvedValue([]),
};

vi.mock('./ConversationList', () => ({
  default: ({ onStartChat }: { onStartChat: any }) => (
    <button onClick={() => onStartChat({ id: '2', name: 'Bob' })}>start</button>
  ),
}));

vi.mock('./ChatWindow', () => ({ default: () => null }));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Alice' } }),
}));

vi.mock('@/contexts/ChatContext', () => ({
  useChat: () => mockUseChat,
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

import ChatSidebar from './ChatSidebar';

describe('ChatSidebar search start chat', () => {
  it('shows toast when fetchConversation fails', async () => {
    mockFetchConversation.mockRejectedValueOnce(new Error('fail'));
    mockUseChat.conversations = [];
    render(
      <ChatSidebar
        isOpen
        expanded
        onToggle={() => {}}
        onExpandedChange={() => {}}
      />
    );

    fireEvent.click(screen.getByText('start'));

    await waitFor(() => expect(mockToast).toHaveBeenCalled());
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
        title: 'Error',
      })
    );
  });
});

describe('ChatSidebar collapsed view', () => {
  it('renders up to 10 avatars with unread badges', () => {
    mockUseChat.conversations = Array.from({ length: 12 }).map((_, i) => ({
      id: i + 1,
      type: 'direct',
      title: `User${i + 1}`,
      avatar: null,
      unreadCount: i + 1,
    }));

    render(
      <ChatSidebar
        isOpen
        expanded={false}
        onToggle={() => {}}
        onExpandedChange={() => {}}
      />
    );

    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
    expect(screen.queryByText('11')).not.toBeInTheDocument();
    expect(screen.queryByText('12')).not.toBeInTheDocument();
  });
});
