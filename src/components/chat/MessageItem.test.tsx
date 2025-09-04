// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import MessageItem from './MessageItem';
import { ChatMessage } from '@/types';
import FileUpload from './FileUpload';

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

  it('calls onFileSelect when choosing a file', () => {
    const handleFileSelect = vi.fn();
    render(<FileUpload onFileSelect={handleFileSelect} />);

    const trigger = screen.getByLabelText('Attach file');
    fireEvent.click(trigger);

    const input = document.querySelector(
      'input[type="file"][accept="image/png,image/jpeg,image/webp"]'
    ) as HTMLInputElement;
    const file = new File(['data'], 'image.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(handleFileSelect).toHaveBeenCalledWith(file, 'image');
  });

  it('renders image attachments as img elements', () => {
    const message: ChatMessage = {
      id: '3',
      senderId: 2,
      senderName: 'Other',
      senderRole: 'student',
      content: 'look',
      timestamp: new Date().toISOString(),
      status: 'sent',
      attachments: [
        { url: 'http://example.com/pic.jpg', type: 'image', name: 'pic' }
      ]
    };

    render(<MessageItem message={message} currentUserId={1} />);
    const img = screen.getByAltText('pic') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe('IMG');
  });

  it('renders document attachments as links with correct href', () => {
    const message: ChatMessage = {
      id: '4',
      senderId: 2,
      senderName: 'Other',
      senderRole: 'student',
      content: '',
      timestamp: new Date().toISOString(),
      status: 'sent',
      attachments: [
        { url: 'http://example.com/doc.pdf', type: 'document', name: 'doc.pdf' }
      ]
    };

    render(<MessageItem message={message} currentUserId={1} />);
    const link = screen.getByRole('link', { name: 'doc.pdf' });
    expect(link).toHaveAttribute('href', 'http://example.com/doc.pdf');
  });
});
