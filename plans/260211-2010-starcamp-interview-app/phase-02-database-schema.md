# Phase 02: Database Schema

## Overview

**Priority:** P1 (Critical)
**Status:** Pending
**Effort:** 3h

Define Prisma schema for all database entities, create migrations, seed default sections and sample questions.

## Key Insights

- 6 predefined sections must be seeded (Intro, CS Foundations, Whiteboard, Technical, Mindset, Wrap-up)
- Questions belong to exactly one section (1:M relationship)
- Interview sessions have many-to-many with questions (junction table)
- Scores stored per question per interview (not aggregated in DB)
- Use Prisma's auto-generated types for type safety across app

## Requirements

### Functional
- Users table for interviewers
- Sections table with 6 predefined entries
- Questions table with section reference, difficulty enum
- InterviewSessions table tracking candidate + interviewer + date
- InterviewSectionConfig table for custom time allocations per session
- InterviewQuestions junction table (session ↔ questions, with order)
- Scores table (per question per interview, 1-5 scale + notes)

### Non-Functional
- All IDs use UUID for security (prevent enumeration)
- Timestamps (createdAt, updatedAt) on all tables
- Cascading deletes where appropriate
- Indexes on foreign keys for query performance

## Architecture

### Entity Relationship Diagram

```
Users (1) ──< (M) Questions [created_by]
Users (1) ──< (M) InterviewSessions [interviewer_id]

Sections (1) ──< (M) Questions [section_id]
Sections (1) ──< (M) InterviewSectionConfig [section_id]

InterviewSessions (1) ──< (M) InterviewSectionConfig
InterviewSessions (1) ──< (M) InterviewQuestions
InterviewSessions (1) ──< (M) Scores

Questions (1) ──< (M) InterviewQuestions
Questions (1) ──< (M) Scores
```

### Schema Structure

**Users** - Interviewers
**Sections** - 6 interview sections (seeded)
**Questions** - Question bank
**InterviewSessions** - Interview instances
**InterviewSectionConfig** - Time allocation per section per session
**InterviewQuestions** - Selected questions for session (M:M junction)
**Scores** - Per-question scores with notes

## Related Code Files

### Files to Create
- `/server/prisma/schema.prisma` - Complete schema
- `/server/prisma/migrations/` - Auto-generated migrations
- `/server/prisma/seed.ts` - Seed script for sections + sample questions
- `/server/package.json` - Add Prisma seed config

### Files to Modify
- `/server/.env` - Ensure DATABASE_URL set

## Implementation Steps

1. **Define Prisma schema models**

   Create `server/prisma/schema.prisma`:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }

   generator client {
     provider = "prisma-client-js"
   }

   model User {
     id        String   @id @default(uuid())
     email     String   @unique
     password  String   // bcrypt hash
     name      String
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt

     questionsCreated   Question[]         @relation("CreatedBy")
     interviewsConducted InterviewSession[] @relation("Interviewer")
   }

   model Section {
     id               String   @id @default(uuid())
     name             String   @unique
     description      String
     defaultDuration  Int      // minutes
     order            Int      @unique
     createdAt        DateTime @default(now())

     questions           Question[]
     interviewSectionConfigs InterviewSectionConfig[]
   }

   enum Difficulty {
     EASY
     MEDIUM
     HARD
   }

   model Question {
     id         String     @id @default(uuid())
     sectionId  String
     text       String     @db.Text
     answer     String     @db.Text
     difficulty Difficulty
     tags       String[]   // Array of strings
     createdBy  String
     createdAt  DateTime   @default(now())
     updatedAt  DateTime   @updatedAt

     section           Section              @relation(fields: [sectionId], references: [id], onDelete: Cascade)
     creator           User                 @relation("CreatedBy", fields: [createdBy], references: [id])
     interviewQuestions InterviewQuestion[]
     scores            Score[]

     @@index([sectionId])
     @@index([difficulty])
   }

   enum SessionStatus {
     SETUP
     IN_PROGRESS
     COMPLETED
     CANCELLED
   }

   model InterviewSession {
     id            String        @id @default(uuid())
     interviewerId String
     candidateName String
     date          DateTime      @default(now())
     status        SessionStatus @default(SETUP)
     createdAt     DateTime      @default(now())
     updatedAt     DateTime      @updatedAt

     interviewer        User                     @relation("Interviewer", fields: [interviewerId], references: [id])
     sectionConfigs     InterviewSectionConfig[]
     selectedQuestions  InterviewQuestion[]
     scores             Score[]

     @@index([interviewerId])
     @@index([status])
   }

   model InterviewSectionConfig {
     id               String @id @default(uuid())
     interviewId      String
     sectionId        String
     durationMinutes  Int
     order            Int

     interview InterviewSession @relation(fields: [interviewId], references: [id], onDelete: Cascade)
     section   Section          @relation(fields: [sectionId], references: [id])

     @@unique([interviewId, sectionId])
     @@index([interviewId])
   }

   model InterviewQuestion {
     id          String @id @default(uuid())
     interviewId String
     questionId  String
     order       Int

     interview InterviewSession @relation(fields: [interviewId], references: [id], onDelete: Cascade)
     question  Question         @relation(fields: [questionId], references: [id])

     @@unique([interviewId, questionId])
     @@index([interviewId])
   }

   model Score {
     id          String   @id @default(uuid())
     interviewId String
     questionId  String
     score       Int      // 1-5
     notes       String?  @db.Text
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt

     interview InterviewSession @relation(fields: [interviewId], references: [id], onDelete: Cascade)
     question  Question         @relation(fields: [questionId], references: [id])

     @@unique([interviewId, questionId])
     @@index([interviewId])
   }
   ```

2. **Create seed script**

   Create `server/prisma/seed.ts`:

   ```typescript
   import { PrismaClient, Difficulty } from '@prisma/client';
   const prisma = new PrismaClient();

   async function main() {
     // Create sections
     const sections = [
       { name: 'Introduction', description: 'Background & motivation', defaultDuration: 5, order: 1 },
       { name: 'CS Foundations', description: 'Programming, OS, DB, networking', defaultDuration: 20, order: 2 },
       { name: 'Whiteboard Coding', description: 'Problem solving & DSA', defaultDuration: 20, order: 3 },
       { name: 'Technical Skills', description: 'Role-specific, self-learning', defaultDuration: 15, order: 4 },
       { name: 'Mindset & Collaboration', description: 'Learning, teamwork', defaultDuration: 10, order: 5 },
       { name: 'Wrap-up', description: 'Candidate questions', defaultDuration: 5, order: 6 },
     ];

     for (const section of sections) {
       await prisma.section.upsert({
         where: { name: section.name },
         update: {},
         create: section,
       });
     }

     console.log('Sections seeded successfully');
   }

   main()
     .catch((e) => {
       console.error(e);
       process.exit(1);
     })
     .finally(async () => {
       await prisma.$disconnect();
     });
   ```

3. **Configure seed script in package.json**

   Add to `server/package.json`:
   ```json
   "prisma": {
     "seed": "ts-node prisma/seed.ts"
   }
   ```

4. **Install ts-node if not present**
   ```bash
   cd server
   npm install -D ts-node
   ```

5. **Create initial migration**
   ```bash
   cd server
   npx prisma migrate dev --name init
   ```

6. **Run seed**
   ```bash
   npx prisma db seed
   ```

7. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

8. **Create Prisma client instance**

   Create `server/src/utils/prisma-client.ts`:
   ```typescript
   import { PrismaClient } from '@prisma/client';

   const prisma = new PrismaClient();

   export default prisma;
   ```

9. **Verify schema in Prisma Studio**
   ```bash
   npx prisma studio
   ```
   - Check all tables created
   - Verify 6 sections seeded

## Todo List

- [ ] Define complete Prisma schema with all models
- [ ] Configure UUID as default ID type
- [ ] Add enums for Difficulty and SessionStatus
- [ ] Set up relationships with foreign keys
- [ ] Add indexes on foreign keys and frequently queried fields
- [ ] Create seed script for 6 sections
- [ ] Configure seed command in package.json
- [ ] Run initial migration
- [ ] Execute seed script
- [ ] Generate Prisma Client
- [ ] Create reusable Prisma client instance
- [ ] Verify schema in Prisma Studio
- [ ] Confirm 6 sections exist in database

## Success Criteria

- `npx prisma migrate dev` runs without errors
- All 7 tables created in PostgreSQL
- 6 sections seeded with correct names and durations
- Prisma Client generated with TypeScript types
- Prisma Studio displays all tables and seeded data
- Foreign key relationships enforce referential integrity
- Cascading deletes configured (delete interview → deletes scores)

## Risk Assessment

**Risk:** PostgreSQL not running or connection fails
**Mitigation:** Verify `DATABASE_URL` in .env, test connection with `psql`

**Risk:** Migration conflicts if schema changed multiple times
**Mitigation:** Use `prisma migrate reset` for clean slate during development

**Risk:** Seed script runs multiple times creating duplicates
**Mitigation:** Use `upsert` with unique constraints in seed script

## Security Considerations

- User passwords stored as bcrypt hashes (never plaintext)
- UUID IDs prevent enumeration attacks
- Foreign key constraints prevent orphaned records
- Row-level security not needed (JWT middleware handles auth)

## Next Steps

Proceed to **Phase 03: Auth System** to implement register/login endpoints with JWT token generation and validation middleware.
