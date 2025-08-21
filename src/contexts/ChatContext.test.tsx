// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

vi.mock('react-virtuoso', () => ({ Virtuoso: () => null }));
vi.mock('@/components/chat/EmojiPicker', () => ({ default: () => null }));
vi.mock('@/components/chat/FileUpload', () => ({ default: () => null }));
vi.mock('@/components/chat/AttachmentPreview', () => ({ default: () => null }));
vi.mock('@/components/chat/MessageItem', () => ({ default: () => null }));
vi.mock('@/components/ui/use-toast', () => ({ toast: vi.fn() }));

import { mergePrivateMessages } from './ChatContext';
import ChatWindow from '@/components/chat/ChatWindow';
import { PrivateMessage } from '@/types';

describe('mergePrivateMessages', () => {
  it('removes falsy entries and duplicates when merging', () => {
    const prev: (PrivateMessage | null | undefined)[] = [
      {
        id: '1',
        sender_id: 1,
        receiver_id: 2,
        content: 'hello',
        created_at: '',
        sender_name: 'A',
        message_type: 'text',
        is_read: 0,
        status: 'sent',
      },
      null,
    ];

    const incoming: (PrivateMessage | null | undefined)[] = [
      undefined,
      {
        id: '2',
        sender_id: 2,
        receiver_id: 1,
        content: 'hi',
        created_at: '',
        sender_name: 'B',
        message_type: 'text',
        is_read: 0,
        status: 'sent',
      },
      {
        id: '1',
        sender_id: 1,
        receiver_id: 2,
        content: 'dup',
        created_at: '',
        sender_name: 'A',
        message_type: 'text',
        is_read: 0,
        status: 'sent',
      },
      null,
    ];

    const result = mergePrivateMessages(prev, incoming);
    expect(result).toHaveLength(2);
    expect(result.map(m => m.id)).toEqual(['1', '2']);
  });
});

describe('ChatWindow typing indicator', () => {
  it('shows typing indicator for direct chats', () => {
    render(
      <ChatWindow
        activeChat={{ type: 'direct', id: '2', title: 'User' }}
        messages={[]}
        currentUserId={1}
        typingUsers={new Set<number>([2])}
        loading={false}
        hasMore={false}
        loadMore={() => {}}
        message=""
        onMessageChange={() => {}}
        onKeyPress={() => {}}
        onSend={() => {}}
        attachments={[]}
        onFileSelect={() => {}}
        onRemoveAttachment={() => {}}
        onEmojiSelect={() => {}}
        onBack={() => {}}
        onClose={() => {}}
        onOpenGroupDialog={() => {}}
      />
    );
    expect(screen.getByText('User is typing…')).toBeInTheDocument();
  });
});
