import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authorize } from '../middleware/authMiddleware';

describe('Authorization Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
    process.env.JWT_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Missing Token Scenarios', () => {
    it('should return 401 when authorization header is missing', () => {
      const middleware = authorize('user');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Unauthorized ：No Token'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header has no Bearer token', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat'
      };

      const middleware = authorize('user');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Invalid Token Scenarios', () => {
    it('should return 401 when token is malformed', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token-here'
      };

      const middleware = authorize('user');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Token expired'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', () => {
      const expiredToken = jwt.sign(
        { sub: 'user-123', role: 'user' },
        'test-secret-key',
        { expiresIn: '-1h' }  // Already expired
      );

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`
      };

      const middleware = authorize('user');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Token expired'
      });
    });
  });

  describe('Valid Token Scenarios', () => {
    it('should call next() when user has valid token for user route', () => {
      const validToken = jwt.sign(
        { sub: 'user-123', role: 'user' },
        'test-secret-key',
        { expiresIn: '1h' }
      );

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };

      const middleware = authorize('user');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect((mockRequest as any).user).toEqual({
        sub: 'user-123',
        role: 'user',
        iat: expect.any(Number),
        exp: expect.any(Number)
      });
    });

    it('should call next() when admin has valid token for user route', () => {
      const adminToken = jwt.sign(
        { sub: 'admin-123', role: 'admin' },
        'test-secret-key',
        { expiresIn: '1h' }
      );

      mockRequest.headers = {
        authorization: `Bearer ${adminToken}`
      };

      const middleware = authorize('user');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next() when admin has valid token for admin route', () => {
      const adminToken = jwt.sign(
        { sub: 'admin-123', role: 'admin' },
        'test-secret-key',
        { expiresIn: '1h' }
      );

      mockRequest.headers = {
        authorization: `Bearer ${adminToken}`
      };

      const middleware = authorize('admin');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).user.role).toBe('admin');
    });
  });

  describe('Authorization Scenarios', () => {
    it('should return 403 when user tries to access admin route', () => {
      const userToken = jwt.sign(
        { sub: 'user-123', role: 'user' },
        'test-secret-key',
        { expiresIn: '1h' }
      );

      mockRequest.headers = {
        authorization: `Bearer ${userToken}`
      };

      const middleware = authorize('admin');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Lack of Permission：require admin authorization'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle tokens with extra whitespace', () => {
      const validToken = jwt.sign(
        { sub: 'user-123', role: 'user' },
        'test-secret-key',
        { expiresIn: '1h' }
      );

      mockRequest.headers = {
        authorization: `  Bearer   ${validToken}  `
      };

      const middleware = authorize('user');
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Should still fail due to whitespace (strict parsing)
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });
});
