import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth-middleware';
import { AuthService } from '../services/auth-service';

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('authMiddleware', () => {
  it('returns 401 when no token cookie', () => {
    const req = { cookies: {} } as Request;
    const res = mockResponse();
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', () => {
    const req = { cookies: { token: 'bad-token' } } as unknown as Request;
    const res = mockResponse();
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and sets userId when token is valid', () => {
    const token = AuthService.generateToken('user-456', 'test@test.com');
    const req = { cookies: { token } } as unknown as Request;
    const res = mockResponse();
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe('user-456');
    expect(req.userEmail).toBe('test@test.com');
  });
});
