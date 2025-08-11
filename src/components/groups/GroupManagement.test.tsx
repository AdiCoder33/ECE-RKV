// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, vi } from 'vitest';
import GroupManagement from './GroupManagement';

describe('GroupManagement', () => {
  it('opens AddGroupMembersModal when Add Members is clicked', async () => {
    const groupsResponse = [
      {
        id: 1,
        name: 'Test Group',
        description: 'Desc',
        type: 'custom',
        member_count: 0,
        created_by: 1,
        created_at: '2024-01-01'
      }
    ];

    vi.stubGlobal('fetch', (url: RequestInfo | URL) => {
      const u = typeof url === 'string' ? url : url.toString();
      if (u.includes('/groups')) {
        return Promise.resolve(new Response(JSON.stringify(groupsResponse)));
      }
      if (u.includes('/users')) {
        return Promise.resolve(new Response(JSON.stringify([])));
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    localStorage.setItem('token', 'test');

    render(<GroupManagement />);

    await screen.findByText('Test Group');

    const addButton = screen.getByRole('button', { name: /add members/i });
    await userEvent.click(addButton);

    await screen.findByText('Add Members to Test Group');

    vi.restoreAllMocks();
  });
});
