// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
import { useAuth } from '../../contexts/AuthContext';
import Settings from './Settings';

const mockedUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

afterEach(() => {
  mockedUseAuth.mockReset();
});

describe('Settings System tab visibility', () => {
  it('shows System tab for admin', () => {
    mockedUseAuth.mockImplementation(() => ({ user: { role: 'admin' } }));
    render(<Settings />);
    const systemTab = screen.getByRole('tab', { name: 'System' });
    expect(systemTab).toBeInTheDocument();
  });
});

