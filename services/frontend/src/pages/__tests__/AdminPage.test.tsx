import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminPage from '../AdminPage';

describe('AdminPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  it('renders with loading state initially', () => {
    global.fetch = vi.fn(() =>
      new Promise(() => {}) // Never resolves to keep loading state
    ) as any;

    render(<AdminPage />);

    expect(screen.getByText('Admin Dashboard 🛡️')).toBeInTheDocument();
    expect(screen.getByText(/Loading.../)).toBeInTheDocument();
  });

  it('fetches and displays admin data on mount', async () => {
    localStorage.setItem('token', 'admin-token-123');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          message: 'sensitive data for admin only'
        })
      })
    ) as any;

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText(/sensitive data for admin only/)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/admin/users',
      expect.objectContaining({
        headers: {
          'Authorization': 'Bearer admin-token-123'
        }
      })
    );
  });

  it('uses token from localStorage for authentication', async () => {
    const adminToken = 'admin-jwt-token-456';
    localStorage.setItem('token', adminToken);

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          message: 'admin data'
        })
      })
    ) as any;

    render(<AdminPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/admin/users',
        expect.objectContaining({
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        })
      );
    });
  });

  it('handles missing token gracefully', async () => {
    // Don't set any token in localStorage

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          message: 'Unauthorized: No Token'
        })
      })
    ) as any;

    render(<AdminPage />);

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
    localStorage.setItem('token', 'admin-token');

    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Network error'))
    ) as any;

    // Component should not crash on error
    expect(() => render(<AdminPage />)).not.toThrow();

    // Loading message should still be visible since fetch failed
    expect(screen.getByText(/Loading.../)).toBeInTheDocument();
  });

  it('handles 401 unauthorized response', async () => {
    localStorage.setItem('token', 'invalid-token');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          message: 'Unauthorized: No Token'
        })
      })
    ) as any;

    render(<AdminPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('handles 403 forbidden response for non-admin users', async () => {
    localStorage.setItem('token', 'user-token');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          message: 'Lack of Permission: require admin authorization'
        })
      })
    ) as any;

    render(<AdminPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Message should display the error
    await waitFor(() => {
      expect(screen.getByText(/Lack of Permission/)).toBeInTheDocument();
    });
  });

  it('updates message state when data is fetched successfully', async () => {
    localStorage.setItem('token', 'valid-admin-token');

    const adminMessage = 'User list: admin@example.com, user@example.com';

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          message: adminMessage
        })
      })
    ) as any;

    render(<AdminPage />);

    // Initially shows loading
    expect(screen.getByText(/Loading.../)).toBeInTheDocument();

    // After fetch completes, shows admin message
    await waitFor(() => {
      expect(screen.getByText(new RegExp(adminMessage))).toBeInTheDocument();
    });

    // Loading message should be gone
    expect(screen.queryByText(/Loading.../)).not.toBeInTheDocument();
  });

  it('renders admin dashboard title with emoji', () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'test' })
    })) as any;

    render(<AdminPage />);

    const heading = screen.getByRole('heading', { name: /Admin Dashboard 🛡️/ });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H1');
  });

  it('displays message in blue color', () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'test message' })
    })) as any;

    render(<AdminPage />);

    const paragraph = screen.getByText(/Backend Response:/);
    expect(paragraph).toHaveStyle({ color: 'blue' });
  });

  it('calls fetch only once on mount', async () => {
    localStorage.setItem('token', 'admin-token');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'test' })
      })
    ) as any;

    const { rerender } = render(<AdminPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Rerender should not trigger another fetch
    rerender(<AdminPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('handles empty response message', async () => {
    localStorage.setItem('token', 'admin-token');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: '' })
      })
    ) as any;

    render(<AdminPage />);

    await waitFor(() => {
      const backendResponse = screen.getByText(/Backend Response:/);
      expect(backendResponse).toBeInTheDocument();
    });
  });

  it('handles malformed JSON response', async () => {
    localStorage.setItem('token', 'admin-token');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })
    ) as any;

    // Component should not crash
    expect(() => render(<AdminPage />)).not.toThrow();
  });

  it('makes request to correct admin endpoint', async () => {
    localStorage.setItem('token', 'admin-token');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'test' })
      })
    ) as any;

    render(<AdminPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/admin/users',
        expect.any(Object)
      );
    });
  });

  it('includes Authorization header in request', async () => {
    const token = 'test-admin-token-789';
    localStorage.setItem('token', token);

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'test' })
      })
    ) as any;

    render(<AdminPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
    });
  });

  it('handles server error (500) response', async () => {
    localStorage.setItem('token', 'admin-token');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          message: 'Internal Server Error'
        })
      })
    ) as any;

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText(/Internal Server Error/)).toBeInTheDocument();
    });
  });
});
