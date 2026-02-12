import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  sub: string;
  role: string;
  email: string;
  exp: number;
  iat: number;
}

export const isTokenExpired = (): boolean => {
  const token = localStorage.getItem('token');

  if (!token) {
    return true;
  }

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const currentTime = Math.floor(Date.now() / 1000);

    // Check if token is expired
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Invalid token:', error);
    return true;
  }
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  window.location.href = '/';
};

export const setupTokenExpirationCheck = (): void => {
  // Check token expiration every 5 minutes
  setInterval(() => {
    if (isTokenExpired()) {
      alert('Your session has expired. Please login again.');
      logout();
    }
  }, 5 * 60 * 1000);
};
