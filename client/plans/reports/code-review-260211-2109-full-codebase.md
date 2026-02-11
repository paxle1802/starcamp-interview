# Code Review: Starcamp Interview App (Full Codebase)

**Date:** 2026-02-11 | **Scope:** Server + Client | **Focus:** Security, logic bugs, crash risks

## Critical Issues

### 1. IDOR: Score endpoints missing ownership check
**Files:** `server/src/controllers/score-controller.ts`, `server/src/services/score-service.ts`

Any authenticated user can submit/read scores for ANY interview by passing an arbitrary `interviewId`. Neither `upsert` nor `listByInterview` verify `interview.interviewerId === req.userId`.

**Fix:** Add ownership verification before upsert/read:
```ts
const interview = await prisma.interviewSession.findUnique({ where: { id: interviewId } });
if (!interview || interview.interviewerId !== userId) throw new Error('Unauthorized');
```

### 2. Interview status bypass: SETUP -> COMPLETED allowed
**File:** `server/src/services/interview-service.ts` line 121-130

`completeInterview` only checks existence and ownership, NOT current status. An interview can jump from `SETUP` directly to `COMPLETED`, skipping `IN_PROGRESS`.

**Fix:** Add guard: `if (interview.status !== 'IN_PROGRESS') throw new Error('Can only complete in-progress interviews');`

## High Priority

### 3. Cookie missing `sameSite` attribute
**File:** `server/src/controllers/auth-controller.ts` lines 37-41, 73-77

Cookies set without `sameSite`. Browsers default to `Lax` now, but explicit is safer.

**Fix:** Add `sameSite: 'lax'` (or `'strict'`) to both `res.cookie()` calls.

### 4. Content-Disposition header injection via candidateName
**File:** `server/src/controllers/export-controller.ts` line 18

`candidateName` only replaces whitespace before insertion into the `Content-Disposition` header. Characters like `"`, newlines, or non-ASCII could break header parsing.

**Fix:** Sanitize to alphanumeric/hyphens only: `candidateName.replace(/[^a-zA-Z0-9-]/g, '_')`

### 5. Export service double DB fetch
**File:** `server/src/controllers/export-controller.ts` lines 8, 16

`getInterviewData(id)` fetched for auth check, then `generateExcel(id)` fetches same data again internally. Pass the already-fetched data to `generateExcel` instead.

## Medium Priority

### 6. Nav links cause full page reloads
**File:** `client/src/App.tsx` lines 64-65

Uses `<a href="/questions">` instead of React Router `<Link to="/questions">`. Each click triggers a full reload, losing React state (including auth context re-fetch).

### 7. Pagination params not validated
**File:** `server/src/controllers/question-controller.ts` lines 14-15

`parseInt(page)` / `parseInt(limit)` can produce `NaN` or negative values. `skip: NaN` would cause a Prisma error.

**Fix:** Clamp values: `Math.max(1, parseInt(page) || 1)` and `Math.min(100, Math.max(1, parseInt(limit) || 50))`

### 8. Score not validated as integer
**File:** `server/src/controllers/score-controller.ts` line 14

`score < 1 || score > 5` passes floats like 1.5. Should also check `Number.isInteger(score)`.

### 9. No express.json body size limit
**File:** `server/src/index.ts` line 22

`express.json()` without `{ limit: '1mb' }` allows arbitrarily large payloads.

## Positive Observations
- Auth middleware correctly applied to all protected routes
- Prisma ORM eliminates SQL injection risk
- httpOnly cookies for JWT (good XSS protection)
- Proper bcrypt hashing with reasonable salt rounds
- Ownership checks on question CRUD and interview access
- Transaction usage for multi-table interview creation/updates
- Login returns same error for wrong email/password (no user enumeration)

## Summary
Two critical issues need fixing: the score endpoint IDOR and the interview status bypass. Both are straightforward fixes. The rest are hardening items appropriate for a local tool moving toward shared use.
