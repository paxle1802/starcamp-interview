# Phase 10: Testing

## Overview

**Priority:** P1 (Critical)
**Status:** Pending
**Effort:** 3h

Implement unit tests (Jest + Supertest for API, Jest + React Testing Library for UI), integration tests for critical flows, and E2E test plan.

## Key Insights

- Focus on critical paths: auth, question CRUD, interview flow, scoring, export
- Mock Prisma client for unit tests (avoid database dependencies)
- Integration tests use test database (separate from dev)
- E2E tests manual for MVP (automated E2E with Playwright in future)
- Aim for 70%+ coverage on business logic (services, controllers)

## Requirements

### Functional
- Unit tests for services (auth, questions, interviews, scores, results, exports)
- Unit tests for controllers (request/response validation)
- Integration tests for API endpoints
- React component tests for key UI components
- Test coverage report generated

### Non-Functional
- Tests run in CI/CD pipeline (npm test)
- Fast test execution (<30s for unit tests)
- Isolated tests (no shared state between tests)
- Clear test descriptions (arrange-act-assert pattern)

## Architecture

```
tests/
├── unit/
│   ├── services/
│   │   ├── auth-service.test.ts
│   │   ├── question-service.test.ts
│   │   ├── interview-service.test.ts
│   │   ├── score-service.test.ts
│   │   └── results-service.test.ts
│   └── controllers/
│       ├── auth-controller.test.ts
│       └── question-controller.test.ts
├── integration/
│   ├── auth-flow.test.ts
│   ├── question-crud.test.ts
│   ├── interview-flow.test.ts
│   └── export-flow.test.ts
└── e2e/
    └── manual-test-plan.md
```

## Related Code Files

### Files to Create
- `/server/tests/unit/services/auth-service.test.ts`
- `/server/tests/unit/services/question-service.test.ts`
- `/server/tests/integration/auth-flow.test.ts`
- `/server/tests/integration/interview-flow.test.ts`
- `/server/jest.config.js` - Jest configuration
- `/server/tests/setup.ts` - Test setup (mock Prisma)
- `/client/src/components/__tests__/question-card.test.tsx`
- `/client/src/components/__tests__/scoring-panel.test.tsx`
- `/client/jest.config.js`
- `/tests/e2e/manual-test-plan.md` - E2E scenarios

### Files to Modify
- `/server/package.json` - Add test scripts
- `/client/package.json` - Add test scripts

## Implementation Steps

1. **Install testing dependencies (server)**
   ```bash
   cd server
   npm install -D jest @types/jest ts-jest supertest @types/supertest
   npm install -D jest-mock-extended
   ```

2. **Configure Jest (server)**

   Create `server/jest.config.js`:
   ```javascript
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     roots: ['<rootDir>/tests'],
     setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
     collectCoverageFrom: [
       'src/**/*.ts',
       '!src/**/*.d.ts',
       '!src/index.ts',
     ],
     coverageThreshold: {
       global: {
         branches: 60,
         functions: 70,
         lines: 70,
         statements: 70,
       },
     },
   };
   ```

3. **Create test setup (server)**

   Create `server/tests/setup.ts`:
   ```typescript
   import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
   import { PrismaClient } from '@prisma/client';

   jest.mock('../src/utils/prisma-client', () => ({
     __esModule: true,
     default: mockDeep<PrismaClient>(),
   }));

   beforeEach(() => {
     mockReset(prismaMock);
   });

   export const prismaMock = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>;
   ```

4. **Write auth service unit tests (server)**

   Create `server/tests/unit/services/auth-service.test.ts`:
   ```typescript
   import { AuthService } from '../../../src/services/auth-service';

   describe('AuthService', () => {
     describe('hashPassword', () => {
       it('should hash password', async () => {
         const password = 'testpassword123';
         const hash = await AuthService.hashPassword(password);

         expect(hash).not.toBe(password);
         expect(hash).toHaveLength(60); // bcrypt hash length
       });
     });

     describe('comparePassword', () => {
       it('should return true for matching password', async () => {
         const password = 'testpassword123';
         const hash = await AuthService.hashPassword(password);
         const isMatch = await AuthService.comparePassword(password, hash);

         expect(isMatch).toBe(true);
       });

       it('should return false for non-matching password', async () => {
         const password = 'testpassword123';
         const hash = await AuthService.hashPassword(password);
         const isMatch = await AuthService.comparePassword('wrongpassword', hash);

         expect(isMatch).toBe(false);
       });
     });

     describe('generateToken', () => {
       it('should generate valid JWT', () => {
         const token = AuthService.generateToken('user-id-123', 'test@example.com');

         expect(token).toBeTruthy();
         expect(typeof token).toBe('string');
         expect(token.split('.')).toHaveLength(3); // JWT structure
       });
     });

     describe('verifyToken', () => {
       it('should verify valid token', () => {
         const token = AuthService.generateToken('user-id-123', 'test@example.com');
         const payload = AuthService.verifyToken(token);

         expect(payload).toBeTruthy();
         expect(payload?.userId).toBe('user-id-123');
         expect(payload?.email).toBe('test@example.com');
       });

       it('should return null for invalid token', () => {
         const payload = AuthService.verifyToken('invalid-token');
         expect(payload).toBeNull();
       });
     });
   });
   ```

5. **Write question service unit tests (server)**

   Create `server/tests/unit/services/question-service.test.ts`:
   ```typescript
   import { QuestionService } from '../../../src/services/question-service';
   import { prismaMock } from '../../setup';
   import { Difficulty } from '@prisma/client';

   describe('QuestionService', () => {
     const mockQuestion = {
       id: 'q1',
       sectionId: 's1',
       text: 'What is a closure?',
       answer: 'A function with access to outer scope',
       difficulty: Difficulty.MEDIUM,
       tags: ['javascript', 'fundamentals'],
       createdBy: 'user1',
       createdAt: new Date(),
       updatedAt: new Date(),
     };

     describe('createQuestion', () => {
       it('should create question successfully', async () => {
         prismaMock.question.create.mockResolvedValue({
           ...mockQuestion,
           section: { id: 's1', name: 'CS Foundations', description: '', defaultDuration: 20, order: 2, createdAt: new Date() },
         } as any);

         const result = await QuestionService.createQuestion(
           {
             sectionId: 's1',
             text: 'What is a closure?',
             answer: 'A function with access to outer scope',
             difficulty: Difficulty.MEDIUM,
             tags: ['javascript'],
           },
           'user1'
         );

         expect(result.text).toBe('What is a closure?');
         expect(prismaMock.question.create).toHaveBeenCalledWith(
           expect.objectContaining({
             data: expect.objectContaining({
               text: 'What is a closure?',
               createdBy: 'user1',
             }),
           })
         );
       });
     });
   });
   ```

6. **Write integration tests for auth flow (server)**

   Create `server/tests/integration/auth-flow.test.ts`:
   ```typescript
   import request from 'supertest';
   import express from 'express';
   import authRoutes from '../../src/routes/auth-routes';

   const app = express();
   app.use(express.json());
   app.use('/api/auth', authRoutes);

   describe('Auth Flow Integration', () => {
     let authCookie: string;

     it('should register new user', async () => {
       const response = await request(app)
         .post('/api/auth/register')
         .send({
           email: 'test@example.com',
           password: 'password123',
           name: 'Test User',
         });

       expect(response.status).toBe(201);
       expect(response.body).toHaveProperty('id');
       expect(response.body.email).toBe('test@example.com');
       expect(response.headers['set-cookie']).toBeDefined();
     });

     it('should login existing user', async () => {
       const response = await request(app)
         .post('/api/auth/login')
         .send({
           email: 'test@example.com',
           password: 'password123',
         });

       expect(response.status).toBe(200);
       expect(response.body.email).toBe('test@example.com');
       authCookie = response.headers['set-cookie'][0];
     });

     it('should access protected route with valid token', async () => {
       const response = await request(app)
         .get('/api/auth/me')
         .set('Cookie', authCookie);

       expect(response.status).toBe(200);
       expect(response.body.email).toBe('test@example.com');
     });

     it('should reject invalid credentials', async () => {
       const response = await request(app)
         .post('/api/auth/login')
         .send({
           email: 'test@example.com',
           password: 'wrongpassword',
         });

       expect(response.status).toBe(401);
     });
   });
   ```

7. **Install testing dependencies (client)**
   ```bash
   cd client
   npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest
   ```

8. **Configure Jest (client)**

   Create `client/jest.config.js`:
   ```javascript
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'jsdom',
     setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
     moduleNameMapper: {
       '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
     },
   };
   ```

   Create `client/src/setupTests.ts`:
   ```typescript
   import '@testing-library/jest-dom';
   ```

9. **Write component tests (client)**

   Create `client/src/components/__tests__/difficulty-badge.test.tsx`:
   ```tsx
   import { render, screen } from '@testing-library/react';
   import { DifficultyBadge } from '../difficulty-badge';

   describe('DifficultyBadge', () => {
     it('renders EASY badge with correct color', () => {
       render(<DifficultyBadge difficulty="EASY" />);
       const badge = screen.getByText('EASY');

       expect(badge).toBeInTheDocument();
       expect(badge).toHaveStyle({ background: '#d4edda' });
     });

     it('renders MEDIUM badge with correct color', () => {
       render(<DifficultyBadge difficulty="MEDIUM" />);
       const badge = screen.getByText('MEDIUM');

       expect(badge).toBeInTheDocument();
       expect(badge).toHaveStyle({ background: '#fff3cd' });
     });

     it('renders HARD badge with correct color', () => {
       render(<DifficultyBadge difficulty="HARD" />);
       const badge = screen.getByText('HARD');

       expect(badge).toBeInTheDocument();
       expect(badge).toHaveStyle({ background: '#f8d7da' });
     });
   });
   ```

10. **Create E2E manual test plan**

    Create `tests/e2e/manual-test-plan.md`:
    ```markdown
    # E2E Manual Test Plan

    ## Scenario 1: Complete Interview Flow

    **Goal:** Conduct an interview from start to finish

    1. Register new interviewer account
    2. Login with credentials
    3. Create 5 questions across different sections
    4. Create new interview session
    5. Enter candidate name
    6. Select 3 questions per section
    7. Configure section times
    8. Save interview setup
    9. Start interview (status → IN_PROGRESS)
    10. Score first question (select 4/5, add notes)
    11. Navigate to next question
    12. Complete all questions in section
    13. Move to next section (timer resets)
    14. Complete all sections
    15. Finish interview (status → COMPLETED)
    16. View results page
    17. Verify overall score calculated correctly
    18. Export PDF (verify download)
    19. Export Excel (verify download, open file)

    **Expected:** All steps complete without errors, files download successfully

    ## Scenario 2: Question Bank Management

    1. Create question with all fields
    2. Verify question appears in list
    3. Filter by section
    4. Filter by difficulty
    5. Edit question (verify only creator can edit)
    6. Delete question (confirm dialog)
    7. Verify question removed from list

    **Expected:** CRUD operations work, ownership enforced

    ## Scenario 3: Timer Accuracy

    1. Start interview
    2. Background tab for 1 minute
    3. Return to tab
    4. Verify timer shows correct time remaining

    **Expected:** No drift when tab backgrounded

    ## Scenario 4: Auto-save

    1. Start interview
    2. Score a question
    3. Wait 30 seconds
    4. Refresh page
    5. Verify score persisted

    **Expected:** Score saved automatically

    ## Scenario 5: Error Handling

    1. Try to access interview created by another user
    2. Try to edit question created by another user
    3. Try to start completed interview
    4. Try to export non-existent interview

    **Expected:** Appropriate error messages, no crashes
    ```

11. **Add test scripts (package.json)**

    Server `package.json`:
    ```json
    "scripts": {
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage"
    }
    ```

    Client `package.json`:
    ```json
    "scripts": {
      "test": "jest",
      "test:watch": "jest --watch"
    }
    ```

## Todo List

- [ ] Install Jest, Supertest, React Testing Library
- [ ] Configure Jest for server and client
- [ ] Create test setup with Prisma mock
- [ ] Write auth service unit tests
- [ ] Write question service unit tests
- [ ] Write interview service unit tests
- [ ] Write score service unit tests
- [ ] Write results service unit tests
- [ ] Write auth flow integration tests
- [ ] Write question CRUD integration tests
- [ ] Write interview flow integration tests
- [ ] Write DifficultyBadge component test
- [ ] Write ScoringPanel component test
- [ ] Write QuestionCard component test
- [ ] Create E2E manual test plan
- [ ] Run tests and fix failures
- [ ] Generate coverage report
- [ ] Verify 70%+ coverage on services

## Success Criteria

- All unit tests pass
- All integration tests pass
- Coverage ≥70% on services and controllers
- No TypeScript compilation errors in tests
- Tests run in <30 seconds
- E2E manual test plan covers critical paths
- npm test runs successfully in CI/CD

## Risk Assessment

**Risk:** Prisma mocking complex and brittle
**Mitigation:** Use jest-mock-extended, focus on service logic not ORM calls

**Risk:** Integration tests slow due to database
**Mitigation:** Use in-memory SQLite for test DB (if needed)

**Risk:** Component tests fail due to styled-components
**Mitigation:** Use identity-obj-proxy for CSS imports

## Security Considerations

- Test auth middleware blocks unauthenticated requests
- Test ownership checks prevent unauthorized edits
- Test input validation rejects malicious payloads

## Next Steps

After completing Phase 10, implementation is complete. Final tasks:
- Run full test suite
- Fix any failing tests
- Generate coverage report
- Conduct manual E2E testing
- Deploy to production (local setup)
- Document deployment process
