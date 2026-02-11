# Phase 03: Auth System

## Overview

**Priority:** P1 (Critical)
**Status:** Pending
**Effort:** 4h

Implement JWT-based authentication with register/login endpoints, password hashing (bcrypt), token generation, and auth middleware to protect routes.

## Key Insights

- Use httpOnly cookies for JWT storage (more secure than localStorage)
- bcrypt work factor of 10-12 provides good security/performance balance
- JWT payload should include minimal data (user ID, email)
- Middleware validates token on every protected route
- Token expiration: 7 days (refresh tokens not needed for MVP)

## Requirements

### Functional
- POST /api/auth/register - Create new user
- POST /api/auth/login - Authenticate user, return JWT
- POST /api/auth/logout - Clear auth cookie
- GET /api/auth/me - Get current user info
- Auth middleware validates JWT on protected routes
- Passwords hashed with bcrypt before storage

### Non-Functional
- JWT tokens expire after 7 days
- Minimum password length: 8 characters
- Email validation (basic format check)
- Duplicate email registration returns error
- Invalid credentials return generic error (prevent email enumeration)

## Architecture

```
Client                   Server
  │                        │
  ├─ POST /register ──────>│ Validate → Hash password → Save user → Generate JWT
  │                        │
  ├─ POST /login ─────────>│ Find user → Verify password → Generate JWT
  │                        │
  ├─ GET /me ─────────────>│ Middleware validates JWT → Return user data
  │      (with cookie)     │
  └─ POST /logout ────────>│ Clear cookie
```

### JWT Middleware Flow
```
Request → Extract JWT from cookie → Verify signature → Decode payload → Attach user to req → Next()
                                      ↓ (fail)
                                   401 Unauthorized
```

## Related Code Files

### Files to Create
- `/server/src/controllers/auth-controller.ts` - Auth endpoints logic
- `/server/src/routes/auth-routes.ts` - Auth route definitions
- `/server/src/middleware/auth-middleware.ts` - JWT validation
- `/server/src/services/auth-service.ts` - Password hashing, token generation
- `/server/src/types/express.d.ts` - Extend Express Request type
- `/server/src/utils/validation.ts` - Input validation helpers

### Files to Modify
- `/server/src/index.ts` - Register auth routes, add cookie parser
- `/server/package.json` - Add cookie-parser dependency

## Implementation Steps

1. **Install dependencies**
   ```bash
   cd server
   npm install cookie-parser
   npm install -D @types/cookie-parser
   ```

2. **Create auth service**

   Create `server/src/services/auth-service.ts`:
   ```typescript
   import bcrypt from 'bcrypt';
   import jwt from 'jsonwebtoken';

   const SALT_ROUNDS = 10;
   const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
   const JWT_EXPIRES_IN = '7d';

   export class AuthService {
     static async hashPassword(password: string): Promise<string> {
       return bcrypt.hash(password, SALT_ROUNDS);
     }

     static async comparePassword(password: string, hash: string): Promise<boolean> {
       return bcrypt.compare(password, hash);
     }

     static generateToken(userId: string, email: string): string {
       return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
     }

     static verifyToken(token: string): { userId: string; email: string } | null {
       try {
         return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
       } catch {
         return null;
       }
     }
   }
   ```

3. **Create validation utilities**

   Create `server/src/utils/validation.ts`:
   ```typescript
   export const isValidEmail = (email: string): boolean => {
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     return emailRegex.test(email);
   };

   export const isValidPassword = (password: string): boolean => {
     return password.length >= 8;
   };
   ```

4. **Create auth controller**

   Create `server/src/controllers/auth-controller.ts`:
   ```typescript
   import { Request, Response } from 'express';
   import prisma from '../utils/prisma-client';
   import { AuthService } from '../services/auth-service';
   import { isValidEmail, isValidPassword } from '../utils/validation';

   export class AuthController {
     static async register(req: Request, res: Response) {
       try {
         const { email, password, name } = req.body;

         // Validation
         if (!email || !password || !name) {
           return res.status(400).json({ error: 'Email, password, and name required' });
         }
         if (!isValidEmail(email)) {
           return res.status(400).json({ error: 'Invalid email format' });
         }
         if (!isValidPassword(password)) {
           return res.status(400).json({ error: 'Password must be at least 8 characters' });
         }

         // Check if user exists
         const existingUser = await prisma.user.findUnique({ where: { email } });
         if (existingUser) {
           return res.status(409).json({ error: 'Email already registered' });
         }

         // Hash password and create user
         const hashedPassword = await AuthService.hashPassword(password);
         const user = await prisma.user.create({
           data: { email, password: hashedPassword, name },
         });

         // Generate token
         const token = AuthService.generateToken(user.id, user.email);

         // Set httpOnly cookie
         res.cookie('token', token, {
           httpOnly: true,
           secure: process.env.NODE_ENV === 'production',
           maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
         });

         res.status(201).json({ id: user.id, email: user.email, name: user.name });
       } catch (error) {
         console.error('Register error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }

     static async login(req: Request, res: Response) {
       try {
         const { email, password } = req.body;

         if (!email || !password) {
           return res.status(400).json({ error: 'Email and password required' });
         }

         // Find user
         const user = await prisma.user.findUnique({ where: { email } });
         if (!user) {
           return res.status(401).json({ error: 'Invalid credentials' });
         }

         // Verify password
         const isValid = await AuthService.comparePassword(password, user.password);
         if (!isValid) {
           return res.status(401).json({ error: 'Invalid credentials' });
         }

         // Generate token
         const token = AuthService.generateToken(user.id, user.email);

         // Set httpOnly cookie
         res.cookie('token', token, {
           httpOnly: true,
           secure: process.env.NODE_ENV === 'production',
           maxAge: 7 * 24 * 60 * 60 * 1000,
         });

         res.json({ id: user.id, email: user.email, name: user.name });
       } catch (error) {
         console.error('Login error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }

     static async logout(req: Request, res: Response) {
       res.clearCookie('token');
       res.json({ message: 'Logged out successfully' });
     }

     static async me(req: Request, res: Response) {
       try {
         const user = await prisma.user.findUnique({
           where: { id: req.userId },
           select: { id: true, email: true, name: true },
         });

         if (!user) {
           return res.status(404).json({ error: 'User not found' });
         }

         res.json(user);
       } catch (error) {
         console.error('Me error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }
   }
   ```

5. **Create auth middleware**

   Create `server/src/middleware/auth-middleware.ts`:
   ```typescript
   import { Request, Response, NextFunction } from 'express';
   import { AuthService } from '../services/auth-service';

   export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
     try {
       const token = req.cookies.token;

       if (!token) {
         return res.status(401).json({ error: 'Authentication required' });
       }

       const payload = AuthService.verifyToken(token);
       if (!payload) {
         return res.status(401).json({ error: 'Invalid or expired token' });
       }

       req.userId = payload.userId;
       req.userEmail = payload.email;
       next();
     } catch (error) {
       res.status(401).json({ error: 'Authentication failed' });
     }
   };
   ```

6. **Extend Express Request type**

   Create `server/src/types/express.d.ts`:
   ```typescript
   declare namespace Express {
     export interface Request {
       userId?: string;
       userEmail?: string;
     }
   }
   ```

7. **Create auth routes**

   Create `server/src/routes/auth-routes.ts`:
   ```typescript
   import { Router } from 'express';
   import { AuthController } from '../controllers/auth-controller';
   import { authMiddleware } from '../middleware/auth-middleware';

   const router = Router();

   router.post('/register', AuthController.register);
   router.post('/login', AuthController.login);
   router.post('/logout', AuthController.logout);
   router.get('/me', authMiddleware, AuthController.me);

   export default router;
   ```

8. **Update main server file**

   Modify `server/src/index.ts`:
   ```typescript
   import express from 'express';
   import cors from 'cors';
   import cookieParser from 'cookie-parser';
   import authRoutes from './routes/auth-routes';

   const app = express();
   const PORT = process.env.PORT || 3001;

   app.use(cors({
     origin: 'http://localhost:5173',
     credentials: true,
   }));
   app.use(express.json());
   app.use(cookieParser());

   app.get('/health', (req, res) => {
     res.json({ status: 'ok' });
   });

   app.use('/api/auth', authRoutes);

   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

9. **Test with curl or Postman**
   ```bash
   # Register
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","name":"Test User"}' \
     -c cookies.txt

   # Login
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}' \
     -c cookies.txt

   # Get current user
   curl http://localhost:3001/api/auth/me -b cookies.txt
   ```

## Todo List

- [ ] Install cookie-parser dependency
- [ ] Create auth service with password hashing and JWT functions
- [ ] Create validation utilities for email and password
- [ ] Implement register controller with duplicate check
- [ ] Implement login controller with password verification
- [ ] Implement logout controller (clear cookie)
- [ ] Implement /me endpoint to get current user
- [ ] Create auth middleware to validate JWT
- [ ] Extend Express Request type with userId/userEmail
- [ ] Create auth routes file
- [ ] Register auth routes in main server
- [ ] Add cookie parser middleware
- [ ] Configure CORS to allow credentials
- [ ] Test register endpoint creates user and sets cookie
- [ ] Test login endpoint validates credentials
- [ ] Test protected /me endpoint requires valid token
- [ ] Test logout clears cookie

## Success Criteria

- Register creates user with hashed password in database
- Login returns user data and sets httpOnly cookie
- Invalid credentials return 401 with generic error
- Duplicate email registration returns 409 error
- Protected routes return 401 without valid token
- /me endpoint returns current user data when authenticated
- Logout clears auth cookie
- JWT tokens expire after 7 days
- Passwords minimum 8 characters enforced

## Risk Assessment

**Risk:** JWT_SECRET not set in production
**Mitigation:** Validate environment variable on server startup, fail if missing

**Risk:** CORS misconfiguration allows unauthorized origins
**Mitigation:** Explicitly whitelist frontend origin, never use `*` in production

**Risk:** bcrypt synchronous methods block event loop
**Mitigation:** Use async methods (hash, compare) always

## Security Considerations

- Passwords hashed with bcrypt (salted, computationally expensive)
- JWT in httpOnly cookies prevents XSS attacks
- Generic "Invalid credentials" message prevents email enumeration
- CORS configured to allow credentials only from frontend origin
- Token expiration enforces re-authentication after 7 days
- Secure flag on cookies in production (HTTPS only)

## Next Steps

Proceed to **Phase 04: Question Bank API** to implement CRUD endpoints for managing questions with section filtering and difficulty levels.
