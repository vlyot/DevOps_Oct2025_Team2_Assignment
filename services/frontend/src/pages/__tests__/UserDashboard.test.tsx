import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UserDashboard from '../UserDashboard';

describe('UserDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  it('renders with loading state initially', () => {
    global.fetch = vi.fn(() =>
      new Promise(() => {}) // Never resolves to keep loading state
    ) as any;

    render(<UserDashboard />);

    expect(screen.getByText('User Dashboard 📂')).toBeInTheDocument();
    expect(screen.getByText(/Loading.../)).toBeInTheDocument();
  });

  it('fetches and displays user data on mount', async () => {
    localStorage.setItem('token', 'mock-token-123');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          message: 'this is your personal document list'
        })
      })
    ) as any;

    render(<UserDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/this is your personal document list/)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/dashboard/files',
      expect.objectContaining({
        headers: {
          'Authorization': 'Bearer mock-token-123'
        }
      })
    );
  });

  it('uses token from localStorage for authentication', async () => {
    const testToken = 'test-jwt-token-456';
    localStorage.setItem('token', testToken);

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          message: 'test message'
        })
      })
    ) as any;

    render(<UserDashboard />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Authorization': `Bearer ${testToken}`
          }
        })
      );
    });
  });

  it('handles missing token gracefully', async () => {
    // Don't set any token in localStorage

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          message: 'unauthorized access'
        })
      })
    ) as any;

    render(<UserDashboard />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer null'
          }
        })
      );
    });
  });

  it('handles API errors gracefully', async () => {
    localStorage.setItem('token', 'mock-token');

    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Network error'))
    ) as any;

    // Component should not crash on error
    expect(() => render(<UserDashboard />)).not.toThrow();

    // Loading message should still be visible since fetch failed
    expect(screen.getByText(/Loading.../)).toBeInTheDocument();
  });

  it('handles 401 unauthorized response', async () => {
    localStorage.setItem('token', 'expired-token');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: 'Unauthorized'
        })
      })
    ) as any;

    render(<UserDashboard />);

    // Component handles error by not updating message
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('handles 403 forbidden response', async () => {
    localStorage.setItem('token', 'user-token');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          message: 'Lack of Permission'
        })
      })
    ) as any;

    render(<UserDashboard />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('updates message state when data is fetched successfully', async () => {
    localStorage.setItem('token', 'valid-token');

    const customMessage = 'Your documents: file1.pdf, file2.doc';

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          message: customMessage
        })
      })
    ) as any;

    render(<UserDashboard />);

    // Initially shows loading
    expect(screen.getByText(/Loading.../)).toBeInTheDocument();

    // After fetch completes, shows custom message
    await waitFor(() => {
      expect(screen.getByText(new RegExp(customMessage))).toBeInTheDocument();
    });

    // Loading message should be gone
    expect(screen.queryByText(/Loading.../)).not.toBeInTheDocument();
  });

  it('renders dashboard title with emoji', () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'test' })
    })) as any;

    render(<UserDashboard />);

    const heading = screen.getByRole('heading', { name: /User Dashboard 📂/ });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H1');
  });

  it('displays message in green color', () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'test message' })
    })) as any;

    render(<UserDashboard />);

    const paragraph = screen.getByText(/Backend Response:/);
    expect(paragraph).toHaveStyle({ color: 'green' });
  });

  it('calls fetch only once on mount', async () => {
    localStorage.setItem('token', 'test-token');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'test' })
      })
    ) as any;

    const { rerender } = render(<UserDashboard />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Rerender should not trigger another fetch
    rerender(<UserDashboard />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('handles empty response message', async () => {
    localStorage.setItem('token', 'test-token');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: '' })
      })
    ) as any;

    render(<UserDashboard />);

    await waitFor(() => {
      const backendResponse = screen.getByText(/Backend Response:/);
      expect(backendResponse).toBeInTheDocument();
    });
  });
});
