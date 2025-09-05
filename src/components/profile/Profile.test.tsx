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
  cacheProfileImage: (value: string) => {
    localStorage.setItem('profileImageCache', value);
    mockCacheProfileImage(value);
  },
}));

import Profile from './Profile';

describe('Profile image upload', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Alice', role: 'professor', profileImage: 'profile-key' },
    });
    localStorage.setItem('token', 'test-token');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, name: 'Alice', role: 'professor', profileImage: 'profile-key' })
    );
  });

  afterEach(() => {
    cleanup();
  });

  it('uploads image and stores key while caching URL for display', async () => {
    const file = new File(['hello'], 'avatar.png', { type: 'image/png' });

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Alice',
          email: 'alice@example.com',
          phone: '123',
          profileImage: 'profile-key',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ key: 'profile-key', url: 'http://example.com/avatar.png' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profileImage: 'profile-key' }),
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

    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    expect(stored.profileImage).toBe('profile-key');
    expect(mockCacheProfileImage).toHaveBeenCalledWith('http://example.com/avatar.png');
  });

  it('sends profile key on subsequent profile save', async () => {
    const file = new File(['hello'], 'avatar.png', { type: 'image/png' });

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Alice',
          email: 'alice@example.com',
          phone: '123',
          profileImage: 'profile-key',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ key: 'profile-key', url: 'http://example.com/avatar.png' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profileImage: 'profile-key' }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    global.fetch = mockFetch as unknown as typeof fetch;

    const { container } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));

    const editBtn = screen.getByRole('button', { name: /Edit Profile/i });
    await userEvent.click(editBtn);

    const phoneInput = screen.getByDisplayValue('123');
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '456');

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(saveBtn);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(4));
    const body = JSON.parse(mockFetch.mock.calls[3][1].body);
    expect(body.profileImage).toBe('profile-key');
  });

  it('includes department when saving profile', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Alice',
          email: 'alice@example.com',
          phone: '123',
          department: 'CSE',
          profileImage: 'profile-key',
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    global.fetch = mockFetch as unknown as typeof fetch;

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    const editBtn = screen.getByRole('button', { name: /Edit Profile/i });
    await userEvent.click(editBtn);

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(saveBtn);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.department).toBe('CSE');
  });

  it('formats dateOfBirth for display and saving', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Alice',
          email: 'alice@example.com',
          phone: '123',
          profileImage: 'profile-key',
          dateOfBirth: '1995-06-15T00:00:00.000Z',
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    global.fetch = mockFetch as unknown as typeof fetch;

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    const dateInput = screen.getByDisplayValue('1995-06-15') as HTMLInputElement;

    const editBtn = screen.getByRole('button', { name: /Edit Profile/i });
    await userEvent.click(editBtn);
    fireEvent.change(dateInput, { target: { value: '1996-07-20' } });

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(saveBtn);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.dateOfBirth).toBe('1996-07-20T00:00:00.000Z');
  });
});

describe('Student profile endpoints', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    mockUseAuth.mockReturnValue({
      user: { id: 2, name: 'Bob', role: 'student', profileImage: 'profile-key' },
    });
    localStorage.setItem('token', 'test-token');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 2, name: 'Bob', role: 'student', profileImage: 'profile-key' })
    );
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
        json: async () => ({
          name: 'Bob',
          email: 'bob@example.com',
          phone: '123',
          rollNumber: 'R1',
          profileImage: 'profile-key',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ key: 'profile-key', url: 'http://example.com/avatar.png' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profileImage: 'profile-key' }),
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

      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    window.dispatchEvent(new Event('resize'));

    expect(dialog).toHaveClass('mx-auto');
    expect(dialog).toHaveClass('sm:max-w-[500px]');
  });
});
