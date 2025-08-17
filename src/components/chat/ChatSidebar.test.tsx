// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

const mockFetchConversation = vi
  .fn()
  .mockResolvedValue({ messages: [], hasMore: false });
const mockToast = vi.fn();
const mockUseChat = {
  conversations: [] as unknown[],
  fetchConversations: vi.fn().mockResolvedValue([]),
  fetchConversation: mockFetchConversation,
  fetchMoreConversation: vi.fn(),
  fetchGroupMessages: vi.fn(),
  fetchMoreGroupMessages: vi.fn(),
  privateMessages: [],
  messages: [],
  sendDirectMessage: vi.fn(),
  sendGroupMessage: vi.fn(),
  markAsRead: vi.fn().mockResolvedValue(undefined),
  pinConversation: vi.fn(),
  fetchGroups: vi.fn().mockResolvedValue([]),
  onlineUsers: new Set<number>(),
  typingUsers: new Set<number>(),
  setTyping: vi.fn(),
  searchUsers: vi.fn().mockResolvedValue([]),
  socketRef: { current: { emit: vi.fn() } },
};

vi.mock('./ConversationList', () => ({
  default: ({
    onStartChat,
    search,
    onSearchChange,
    searchResults,
  }: {
    onStartChat: (u: unknown) => void;
    search: string;
    onSearchChange: (v: string) => void;
    searchResults: { id: number; name: string }[];
  }) => (
    <div>
      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {searchResults.map(u => (
        <div key={u.id} onClick={() => onStartChat(u)}>
          {u.name}
        </div>
      ))}
      <button onClick={() => onStartChat({ id: '2', name: 'Bob' })}>start</button>
    </div>
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

beforeEach(() => {
  mockUseChat.socketRef.current.emit.mockReset();
});

afterEach(() => {
  cleanup();
});

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

    fireEvent.click(screen.getAllByText('start')[0]);

    await waitFor(() => expect(mockToast).toHaveBeenCalled());
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
        title: 'Error',
      })
    );
  });

  it('emits join-room on successful start chat', async () => {
    mockUseChat.conversations = [];
    render(
      <ChatSidebar
        isOpen
        expanded
        onToggle={() => {}}
        onExpandedChange={() => {}}
      />
    );

    fireEvent.click(screen.getAllByText('start')[0]);

    await waitFor(() =>
      expect(mockUseChat.socketRef.current.emit).toHaveBeenCalledWith(
        'join-room',
        'user:2'
      )
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

describe('ChatSidebar search filtering', () => {
  it('does not show current user in search results', async () => {
    vi.useFakeTimers();
    mockUseChat.conversations = [];
    mockUseChat.searchUsers.mockResolvedValueOnce([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);

    render(
      <ChatSidebar
        isOpen
        expanded
        onToggle={() => {}}
        onExpandedChange={() => {}}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'Alice' },
    });

    await vi.runAllTimersAsync();
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });
});
