import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import MessageItem from './MessageItem';
import { ChatMessage } from '@/types';

expect.extend(matchers);

describe('MessageItem', () => {
  it('wraps long messages and limits width', () => {
    const longText = 'A'.repeat(1000);
    const message: ChatMessage = {
      id: '1',
      senderId: 2,
      senderName: 'Other',
      senderRole: 'student',
      content: longText,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    render(<MessageItem message={message} currentUserId={1} />);
    const bubble = screen.getByText(longText).closest('div');
    expect(bubble).toHaveClass('max-w-[80%]');
    expect(bubble).toHaveClass('break-words');
    expect(bubble).toHaveClass('break-all');
  });

  it('shows sender name inside bubble for group messages', () => {
    const message: ChatMessage = {
      id: '2',
      senderId: 2,
      senderName: 'Other',
      senderRole: 'student',
      content: 'Hello',
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    render(<MessageItem message={message} currentUserId={1} isGroup />);
    const bubble = screen.getByText('Hello').closest('div');
    expect(bubble).toHaveClass('flex');
    expect(bubble).toHaveClass('flex-col');
    expect(bubble).toHaveClass('items-start');
    const name = screen.getByText('Other');
    expect(bubble).toContainElement(name);
    expect(name).toHaveClass('text-purple-900');
  });
});
