import { describe, it, expect } from 'vitest';
import { mergePrivateMessages } from './ChatContext';

interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender_name: string;
  message_type: string;
  is_read: number;
}

describe('mergePrivateMessages', () => {
  it('removes falsy entries and duplicates when merging', () => {
    const prev: (PrivateMessage | null | undefined)[] = [
      {
        id: '1',
        sender_id: 'a',
        receiver_id: 'b',
        content: 'hello',
        created_at: '',
        sender_name: 'A',
        message_type: 'text',
        is_read: 0,
      },
      null,
    ];

    const incoming: (PrivateMessage | null | undefined)[] = [
      undefined,
      {
        id: '2',
        sender_id: 'b',
        receiver_id: 'a',
        content: 'hi',
        created_at: '',
        sender_name: 'B',
        message_type: 'text',
        is_read: 0,
      },
      {
        id: '1',
        sender_id: 'a',
        receiver_id: 'b',
        content: 'dup',
        created_at: '',
        sender_name: 'A',
        message_type: 'text',
        is_read: 0,
      },
      null,
    ];

    const result = mergePrivateMessages(prev, incoming);
    expect(result).toHaveLength(2);
    expect(result.map(m => m.id)).toEqual(['1', '2']);
  });
});
