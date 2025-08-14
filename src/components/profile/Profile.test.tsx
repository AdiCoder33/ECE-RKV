// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Alice', role: 'professor' } }),
}));

import Profile from './Profile';

describe('Profile image upload', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Alice', role: 'professor' }));
  });

  it('uploads image and updates profileImage state with returned URL', async () => {
    const file = new File(['hello'], 'avatar.png', { type: 'image/png' });

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Alice', email: 'alice@example.com', phone: '123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'http://example.com/avatar.png' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profileImage: 'http://example.com/avatar.png' }),
      });
    global.fetch = mockFetch as unknown as typeof fetch;

    const { container } = render(<Profile />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));
    const formData = mockFetch.mock.calls[1][1].body as FormData;
    expect(formData.get('image')).toBe(file);

    await waitFor(() =>
      expect(screen.getByAltText('Profile')).toHaveAttribute('src', 'http://example.com/avatar.png')
    );

    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    expect(stored.profileImage).toBe('http://example.com/avatar.png');
  });
});
