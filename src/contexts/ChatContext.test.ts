import { describe, it, expect } from 'vitest';
import { mergePrivateMessages } from './ChatContext';
import { PrivateMessage } from '@/types';

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
        status: 'sent',
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
        status: 'sent',
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
        status: 'sent',
      },
      null,
    ];

    const result = mergePrivateMessages(prev, incoming);
    expect(result).toHaveLength(2);
    expect(result.map(m => m.id)).toEqual(['1', '2']);
  });
});
