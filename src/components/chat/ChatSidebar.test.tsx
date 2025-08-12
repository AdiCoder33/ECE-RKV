// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

const mockFetchConversation = vi.fn();
const mockToast = vi.fn();

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
  useAuth: () => ({ user: { id: '1', name: 'Alice' } }),
}));

vi.mock('@/contexts/ChatContext', () => ({
  useChat: () => ({
    conversations: [],
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
    onlineUsers: [],
    typingUsers: new Set(),
    setTyping: vi.fn(),
    searchUsers: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

import ChatSidebar from './ChatSidebar';

describe('ChatSidebar search start chat', () => {
  it('shows toast when fetchConversation fails', async () => {
    mockFetchConversation.mockRejectedValueOnce(new Error('fail'));
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
