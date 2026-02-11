# Phase 04: Question Bank API

## Overview

**Priority:** P1 (Critical)
**Status:** Pending
**Effort:** 4h

Build REST API for question bank CRUD operations with filtering by section, difficulty, and tags. Questions ordered by difficulty within sections.

## Key Insights

- Questions belong to one section (enforce via foreign key)
- Filtering by multiple criteria common (section + difficulty + tags)
- List endpoint should support pagination for large question banks
- Users can only edit/delete questions they created
- Tags stored as string array (PostgreSQL supports arrays)

## Requirements

### Functional
- GET /api/questions - List questions (filterable, paginated)
- GET /api/questions/:id - Get single question with answer
- POST /api/questions - Create new question
- PUT /api/questions/:id - Update question (creator only)
- DELETE /api/questions/:id - Delete question (creator only)
- GET /api/sections - List all sections

### Non-Functional
- Pagination: 50 questions per page default
- Questions ordered by difficulty (Easy → Medium → Hard) within section
- Filter by section, difficulty, tags (combined with AND logic)
- Response includes section name with question
- Created timestamp tracked for audit

## Architecture

```
Client Request
     ↓
Auth Middleware (validate JWT)
     ↓
Question Controller
     ↓
Question Service (business logic)
     ↓
Prisma Client (database queries)
     ↓
PostgreSQL
```

### Query Filters
- `?sectionId=uuid` - Filter by section
- `?difficulty=EASY|MEDIUM|HARD` - Filter by difficulty
- `?tags=react,typescript` - Filter by tags (comma-separated)
- `?page=1&limit=50` - Pagination

## Related Code Files

### Files to Create
- `/server/src/controllers/question-controller.ts` - Question CRUD handlers
- `/server/src/controllers/section-controller.ts` - Section list handler
- `/server/src/services/question-service.ts` - Business logic
- `/server/src/routes/question-routes.ts` - Question API routes
- `/server/src/routes/section-routes.ts` - Section API routes
- `/server/src/types/question-types.ts` - Request/response types

### Files to Modify
- `/server/src/index.ts` - Register question and section routes

## Implementation Steps

1. **Create question types**

   Create `server/src/types/question-types.ts`:
   ```typescript
   import { Difficulty } from '@prisma/client';

   export interface CreateQuestionDTO {
     sectionId: string;
     text: string;
     answer: string;
     difficulty: Difficulty;
     tags?: string[];
   }

   export interface UpdateQuestionDTO {
     text?: string;
     answer?: string;
     difficulty?: Difficulty;
     tags?: string[];
   }

   export interface QuestionFilters {
     sectionId?: string;
     difficulty?: Difficulty;
     tags?: string[];
     page?: number;
     limit?: number;
   }
   ```

2. **Create question service**

   Create `server/src/services/question-service.ts`:
   ```typescript
   import prisma from '../utils/prisma-client';
   import { Difficulty } from '@prisma/client';
   import { CreateQuestionDTO, UpdateQuestionDTO, QuestionFilters } from '../types/question-types';

   const DIFFICULTY_ORDER = { EASY: 1, MEDIUM: 2, HARD: 3 };

   export class QuestionService {
     static async listQuestions(filters: QuestionFilters, userId: string) {
       const { sectionId, difficulty, tags, page = 1, limit = 50 } = filters;
       const skip = (page - 1) * limit;

       const where: any = {};
       if (sectionId) where.sectionId = sectionId;
       if (difficulty) where.difficulty = difficulty;
       if (tags && tags.length > 0) {
         where.tags = { hasSome: tags };
       }

       const [questions, total] = await Promise.all([
         prisma.question.findMany({
           where,
           include: { section: true },
           orderBy: [
             { section: { order: 'asc' } },
             { difficulty: 'asc' }, // Prisma orders enums alphabetically; custom sort needed
           ],
           skip,
           take: limit,
         }),
         prisma.question.count({ where }),
       ]);

       // Custom sort by difficulty order
       const sorted = questions.sort((a, b) =>
         DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
       );

       return {
         questions: sorted,
         total,
         page,
         totalPages: Math.ceil(total / limit),
       };
     }

     static async getQuestionById(id: string) {
       return prisma.question.findUnique({
         where: { id },
         include: { section: true, creator: { select: { id: true, name: true, email: true } } },
       });
     }

     static async createQuestion(data: CreateQuestionDTO, createdBy: string) {
       return prisma.question.create({
         data: { ...data, createdBy },
         include: { section: true },
       });
     }

     static async updateQuestion(id: string, data: UpdateQuestionDTO, userId: string) {
       // Check ownership
       const question = await prisma.question.findUnique({ where: { id } });
       if (!question) throw new Error('Question not found');
       if (question.createdBy !== userId) throw new Error('Unauthorized');

       return prisma.question.update({
         where: { id },
         data,
         include: { section: true },
       });
     }

     static async deleteQuestion(id: string, userId: string) {
       // Check ownership
       const question = await prisma.question.findUnique({ where: { id } });
       if (!question) throw new Error('Question not found');
       if (question.createdBy !== userId) throw new Error('Unauthorized');

       return prisma.question.delete({ where: { id } });
     }
   }
   ```

3. **Create question controller**

   Create `server/src/controllers/question-controller.ts`:
   ```typescript
   import { Request, Response } from 'express';
   import { QuestionService } from '../services/question-service';
   import { Difficulty } from '@prisma/client';

   export class QuestionController {
     static async list(req: Request, res: Response) {
       try {
         const { sectionId, difficulty, tags, page, limit } = req.query;

         const filters = {
           sectionId: sectionId as string,
           difficulty: difficulty as Difficulty,
           tags: tags ? (tags as string).split(',') : undefined,
           page: page ? parseInt(page as string) : 1,
           limit: limit ? parseInt(limit as string) : 50,
         };

         const result = await QuestionService.listQuestions(filters, req.userId!);
         res.json(result);
       } catch (error) {
         console.error('List questions error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }

     static async getById(req: Request, res: Response) {
       try {
         const { id } = req.params;
         const question = await QuestionService.getQuestionById(id);

         if (!question) {
           return res.status(404).json({ error: 'Question not found' });
         }

         res.json(question);
       } catch (error) {
         console.error('Get question error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }

     static async create(req: Request, res: Response) {
       try {
         const { sectionId, text, answer, difficulty, tags } = req.body;

         if (!sectionId || !text || !answer || !difficulty) {
           return res.status(400).json({ error: 'sectionId, text, answer, and difficulty required' });
         }

         if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
           return res.status(400).json({ error: 'difficulty must be EASY, MEDIUM, or HARD' });
         }

         const question = await QuestionService.createQuestion(
           { sectionId, text, answer, difficulty, tags },
           req.userId!
         );

         res.status(201).json(question);
       } catch (error) {
         console.error('Create question error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }

     static async update(req: Request, res: Response) {
       try {
         const { id } = req.params;
         const { text, answer, difficulty, tags } = req.body;

         if (difficulty && !['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
           return res.status(400).json({ error: 'difficulty must be EASY, MEDIUM, or HARD' });
         }

         const question = await QuestionService.updateQuestion(
           id,
           { text, answer, difficulty, tags },
           req.userId!
         );

         res.json(question);
       } catch (error: any) {
         if (error.message === 'Question not found') {
           return res.status(404).json({ error: 'Question not found' });
         }
         if (error.message === 'Unauthorized') {
           return res.status(403).json({ error: 'You can only edit questions you created' });
         }
         console.error('Update question error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }

     static async delete(req: Request, res: Response) {
       try {
         const { id } = req.params;
         await QuestionService.deleteQuestion(id, req.userId!);
         res.status(204).send();
       } catch (error: any) {
         if (error.message === 'Question not found') {
           return res.status(404).json({ error: 'Question not found' });
         }
         if (error.message === 'Unauthorized') {
           return res.status(403).json({ error: 'You can only delete questions you created' });
         }
         console.error('Delete question error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }
   }
   ```

4. **Create section controller**

   Create `server/src/controllers/section-controller.ts`:
   ```typescript
   import { Request, Response } from 'express';
   import prisma from '../utils/prisma-client';

   export class SectionController {
     static async list(req: Request, res: Response) {
       try {
         const sections = await prisma.section.findMany({
           orderBy: { order: 'asc' },
         });
         res.json(sections);
       } catch (error) {
         console.error('List sections error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }
   }
   ```

5. **Create question routes**

   Create `server/src/routes/question-routes.ts`:
   ```typescript
   import { Router } from 'express';
   import { QuestionController } from '../controllers/question-controller';
   import { authMiddleware } from '../middleware/auth-middleware';

   const router = Router();

   router.use(authMiddleware); // All question routes require auth

   router.get('/', QuestionController.list);
   router.get('/:id', QuestionController.getById);
   router.post('/', QuestionController.create);
   router.put('/:id', QuestionController.update);
   router.delete('/:id', QuestionController.delete);

   export default router;
   ```

6. **Create section routes**

   Create `server/src/routes/section-routes.ts`:
   ```typescript
   import { Router } from 'express';
   import { SectionController } from '../controllers/section-controller';
   import { authMiddleware } from '../middleware/auth-middleware';

   const router = Router();

   router.use(authMiddleware);
   router.get('/', SectionController.list);

   export default router;
   ```

7. **Register routes in main server**

   Modify `server/src/index.ts`:
   ```typescript
   import questionRoutes from './routes/question-routes';
   import sectionRoutes from './routes/section-routes';

   // ... existing code ...

   app.use('/api/questions', questionRoutes);
   app.use('/api/sections', sectionRoutes);
   ```

8. **Test endpoints with curl**
   ```bash
   # Login first to get token
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}' \
     -c cookies.txt

   # Get sections
   curl http://localhost:3001/api/sections -b cookies.txt

   # Create question
   curl -X POST http://localhost:3001/api/questions \
     -H "Content-Type: application/json" \
     -b cookies.txt \
     -d '{
       "sectionId":"<section-uuid>",
       "text":"What is a closure in JavaScript?",
       "answer":"A closure is a function that has access to variables in its outer scope...",
       "difficulty":"MEDIUM",
       "tags":["javascript","fundamentals"]
     }'

   # List questions
   curl "http://localhost:3001/api/questions?difficulty=MEDIUM" -b cookies.txt
   ```

## Todo List

- [ ] Create question type definitions
- [ ] Implement question service with CRUD methods
- [ ] Add difficulty custom sorting (EASY → MEDIUM → HARD)
- [ ] Implement ownership check for update/delete
- [ ] Create question controller with validation
- [ ] Create section controller for listing sections
- [ ] Define question routes with auth middleware
- [ ] Define section routes with auth middleware
- [ ] Register routes in main server
- [ ] Test list questions with filters (section, difficulty, tags)
- [ ] Test create question endpoint
- [ ] Test get single question endpoint
- [ ] Test update question (authorized user)
- [ ] Test update question (unauthorized user returns 403)
- [ ] Test delete question (authorized user)
- [ ] Test delete question (unauthorized user returns 403)
- [ ] Test pagination with page and limit params
- [ ] Verify questions ordered by difficulty within sections

## Success Criteria

- List questions returns paginated results
- Filters work correctly (section, difficulty, tags combined)
- Questions ordered EASY → MEDIUM → HARD within same section
- Create question requires auth and valid section ID
- Update/delete only allowed for question creator (403 for others)
- Section list returns all 6 sections ordered correctly
- Invalid difficulty value returns 400 error
- Missing required fields returns 400 error
- Question includes section name in response

## Risk Assessment

**Risk:** Large question banks cause slow queries
**Mitigation:** Add database indexes on sectionId, difficulty; implement pagination

**Risk:** Tag filtering inefficient with hasSome
**Mitigation:** PostgreSQL GIN index on tags array column (add in future if needed)

**Risk:** Difficulty enum ordering incorrect
**Mitigation:** Custom sort logic in service layer (already implemented)

## Security Considerations

- All endpoints require authentication (authMiddleware)
- Users can only modify/delete their own questions
- Input validation prevents invalid difficulty values
- Prisma prevents SQL injection via parameterized queries
- Creator ID attached from JWT (not from request body)

## Next Steps

Proceed to **Phase 05: Question Bank UI** to build React components for displaying, creating, editing, and deleting questions with section filtering.
