// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

import { AuthProvider, useAuth } from './AuthContext';

describe('AuthContext login', () => {
  it('navigates to role-based dashboard on login', async () => {
    const fakeUser = { id: 1, role: 'admin' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 't', user: fakeUser }),
    }) as unknown as typeof fetch;

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('a', 'b');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });
});
