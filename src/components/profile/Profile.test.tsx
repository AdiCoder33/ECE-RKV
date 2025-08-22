// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

const mockUseAuth = vi.fn();
const mockCacheProfileImage = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));
vi.mock('@/lib/profileImageCache', () => ({
  cacheProfileImage: (value: string) => mockCacheProfileImage(value),
}));

import Profile from './Profile';

describe('Profile image upload', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    mockUseAuth.mockReturnValue({ user: { id: 1, name: 'Alice', role: 'professor' } });
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Alice', role: 'professor' }));
  });

  afterEach(() => {
    cleanup();
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

    const { container } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

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
    expect(mockCacheProfileImage).toHaveBeenCalledWith('http://example.com/avatar.png');
  });
});

describe('Student profile endpoints', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    mockUseAuth.mockReturnValue({ user: { id: 2, name: 'Bob', role: 'student' } });
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: 2, name: 'Bob', role: 'student' }));
  });

  afterEach(() => {
    cleanup();
  });

  it('fetches and updates student profile using student endpoints', async () => {
    const file = new File(['hello'], 'avatar.png', { type: 'image/png' });
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Bob', email: 'bob@example.com', phone: '123', rollNumber: 'R1' }),
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

    const { container } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(mockFetch.mock.calls[0][0]).toContain('/students/2/profile');

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));
    await waitFor(() =>
      expect(screen.getByAltText('Profile')).toHaveAttribute('src', 'http://example.com/avatar.png')
    );
    expect(mockCacheProfileImage).toHaveBeenCalledWith('http://example.com/avatar.png');
  });
});

describe('Achievement dialog layout', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    mockUseAuth.mockReturnValue({ user: { id: 1, name: 'Alice', role: 'professor' } });
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    cleanup();
  });

  it('applies responsive width and centering classes', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ achievements: [] }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const tab = await screen.findByRole('tab', { name: /Achievements/i });
    await userEvent.click(tab);
    const addBtn = await screen.findByRole('button', { name: /Add Achievement/i });
    await userEvent.click(addBtn);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('mx-auto');
    expect(dialog).toHaveClass('sm:max-w-[500px]');

    (window as any).innerWidth = 500;
    window.dispatchEvent(new Event('resize'));

    expect(dialog).toHaveClass('mx-auto');
    expect(dialog).toHaveClass('sm:max-w-[500px]');
  });
});
