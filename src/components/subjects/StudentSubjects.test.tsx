import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
import StudentSubjects from './StudentSubjects';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, year: 1, semester: 1, section: 'A' } })
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

vi.mock('@/Assets/loader.mp4', () => ({ default: 'loader.mp4' }));

describe('StudentSubjects', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: '1',
            name: 'Math',
            code: 'M1',
            credits: 3,
            type: 'core',
            mid1: 25,
            mid2: 30,
            mid3: 20,
            internal: 37,
            internalTotal: 40,
            attendance: 80
          }
        ])
    }) as any;
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue('token')
    } as any);
  });

  it('renders internal marks out of 40 and mid values', async () => {
    render(<StudentSubjects />);
    await screen.findByText('37/40');
    expect(screen.getByText(/Mid1: 25/)).toBeInTheDocument();
    expect(screen.getByText(/Mid2: 30/)).toBeInTheDocument();
    expect(screen.getByText(/Mid3: 20/)).toBeInTheDocument();
  });
});
