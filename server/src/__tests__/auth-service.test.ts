import { describe, it, expect } from 'vitest';
import { AuthService } from '../services/auth-service';

describe('AuthService', () => {
  describe('hashPassword / comparePassword', () => {
    it('hashes and verifies correctly', async () => {
      const password = 'testpassword123';
      const hash = await AuthService.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(await AuthService.comparePassword(password, hash)).toBe(true);
    });

    it('rejects wrong password', async () => {
      const hash = await AuthService.hashPassword('correct-password');
      expect(await AuthService.comparePassword('wrong-password', hash)).toBe(false);
    });
  });

  describe('generateToken / verifyToken', () => {
    it('generates and verifies a valid token', () => {
      const token = AuthService.generateToken('user-123', 'test@example.com');
      const payload = AuthService.verifyToken(token);

      expect(payload).not.toBeNull();
      expect(payload!.userId).toBe('user-123');
      expect(payload!.email).toBe('test@example.com');
    });

    it('returns null for invalid token', () => {
      expect(AuthService.verifyToken('invalid-token')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(AuthService.verifyToken('')).toBeNull();
    });
  });
});
