# Phase 06: Interview Setup

## Overview

**Priority:** P1 (Critical)
**Status:** Pending
**Effort:** 4h

Build interview session creation flow: API and UI for entering candidate name, selecting questions per section, configuring time allocation.

## Key Insights

- Interview setup happens before live session starts (status: SETUP)
- Each section gets custom time allocation (default values from section)
- Questions selected manually per section (not auto-assigned)
- Session saved as draft, can be edited before starting
- InterviewSectionConfig stores time per section
- InterviewQuestions stores selected questions with order

## Requirements

### Functional
- POST /api/interviews - Create new interview session
- PUT /api/interviews/:id - Update session (candidate name, questions, time)
- GET /api/interviews/:id - Get session details
- GET /api/interviews - List all interviews for current user
- UI wizard: Step 1 (candidate name) → Step 2 (select questions per section) → Step 3 (configure time) → Review & Save
- Default time populated from section defaults
- Questions displayed grouped by section for selection
- Multi-select questions per section
- Reorder selected questions via drag-and-drop (optional for MVP)

### Non-Functional
- Minimum 1 question required per section
- Time allocation min 1 minute, max 60 minutes per section
- Session status starts as SETUP
- Can only edit sessions in SETUP status

## Architecture

```
InterviewSetupPage
├── StepIndicator (1/3, 2/3, 3/3)
├── Step1: CandidateNameForm
├── Step2: QuestionSelectionPanel
│   └── SectionAccordion[] (6 sections)
│       └── QuestionCheckboxList
├── Step3: TimeConfigurationPanel
│   └── SectionTimeInput[] (6 sections)
└── ReviewAndSavePanel
```

### Data Flow
```
User Input → Local State → API Payload → Server Validation → Prisma Transaction → Response
```

## Related Code Files

### Files to Create
- `/server/src/controllers/interview-controller.ts` - Interview CRUD
- `/server/src/services/interview-service.ts` - Business logic
- `/server/src/routes/interview-routes.ts` - Interview routes
- `/server/src/types/interview-types.ts` - DTO types
- `/client/src/pages/interview-setup-page.tsx` - Setup wizard
- `/client/src/components/step-indicator.tsx` - Progress indicator
- `/client/src/components/candidate-name-form.tsx` - Step 1
- `/client/src/components/question-selection-panel.tsx` - Step 2
- `/client/src/components/time-configuration-panel.tsx` - Step 3
- `/client/src/services/interview-service.ts` - Interview API client
- `/client/src/types/interview.ts` - Interview types

### Files to Modify
- `/server/src/index.ts` - Register interview routes

## Implementation Steps

1. **Create interview types (server)**

   Create `server/src/types/interview-types.ts`:
   ```typescript
   export interface CreateInterviewDTO {
     candidateName: string;
     sectionConfigs: {
       sectionId: string;
       durationMinutes: number;
     }[];
     selectedQuestions: {
       questionId: string;
       order: number;
     }[];
   }

   export interface UpdateInterviewDTO {
     candidateName?: string;
     sectionConfigs?: {
       sectionId: string;
       durationMinutes: number;
     }[];
     selectedQuestions?: {
       questionId: string;
       order: number;
     }[];
   }
   ```

2. **Create interview service (server)**

   Create `server/src/services/interview-service.ts`:
   ```typescript
   import prisma from '../utils/prisma-client';
   import { CreateInterviewDTO, UpdateInterviewDTO } from '../types/interview-types';

   export class InterviewService {
     static async createInterview(data: CreateInterviewDTO, interviewerId: string) {
       return prisma.$transaction(async (tx) => {
         // Create interview session
         const interview = await tx.interviewSession.create({
           data: {
             interviewerId,
             candidateName: data.candidateName,
             status: 'SETUP',
           },
         });

         // Create section configs
         await tx.interviewSectionConfig.createMany({
           data: data.sectionConfigs.map((sc, idx) => ({
             interviewId: interview.id,
             sectionId: sc.sectionId,
             durationMinutes: sc.durationMinutes,
             order: idx + 1,
           })),
         });

         // Create interview questions
         await tx.interviewQuestion.createMany({
           data: data.selectedQuestions.map((q) => ({
             interviewId: interview.id,
             questionId: q.questionId,
             order: q.order,
           })),
         });

         return interview;
       });
     }

     static async updateInterview(id: string, data: UpdateInterviewDTO, userId: string) {
       // Check ownership
       const interview = await prisma.interviewSession.findUnique({ where: { id } });
       if (!interview) throw new Error('Interview not found');
       if (interview.interviewerId !== userId) throw new Error('Unauthorized');
       if (interview.status !== 'SETUP') throw new Error('Can only edit interviews in SETUP status');

       return prisma.$transaction(async (tx) => {
         // Update candidate name if provided
         if (data.candidateName) {
           await tx.interviewSession.update({
             where: { id },
             data: { candidateName: data.candidateName },
           });
         }

         // Update section configs if provided
         if (data.sectionConfigs) {
           await tx.interviewSectionConfig.deleteMany({ where: { interviewId: id } });
           await tx.interviewSectionConfig.createMany({
             data: data.sectionConfigs.map((sc, idx) => ({
               interviewId: id,
               sectionId: sc.sectionId,
               durationMinutes: sc.durationMinutes,
               order: idx + 1,
             })),
           });
         }

         // Update questions if provided
         if (data.selectedQuestions) {
           await tx.interviewQuestion.deleteMany({ where: { interviewId: id } });
           await tx.interviewQuestion.createMany({
             data: data.selectedQuestions.map((q) => ({
               interviewId: id,
               questionId: q.questionId,
               order: q.order,
             })),
           });
         }

         return tx.interviewSession.findUnique({ where: { id } });
       });
     }

     static async getInterview(id: string, userId: string) {
       const interview = await prisma.interviewSession.findUnique({
         where: { id },
         include: {
           sectionConfigs: {
             include: { section: true },
             orderBy: { order: 'asc' },
           },
           selectedQuestions: {
             include: { question: { include: { section: true } } },
             orderBy: { order: 'asc' },
           },
         },
       });

       if (!interview) throw new Error('Interview not found');
       if (interview.interviewerId !== userId) throw new Error('Unauthorized');

       return interview;
     }

     static async listInterviews(userId: string) {
       return prisma.interviewSession.findMany({
         where: { interviewerId: userId },
         include: {
           sectionConfigs: { include: { section: true } },
         },
         orderBy: { createdAt: 'desc' },
       });
     }
   }
   ```

3. **Create interview controller (server)**

   Create `server/src/controllers/interview-controller.ts`:
   ```typescript
   import { Request, Response } from 'express';
   import { InterviewService } from '../services/interview-service';

   export class InterviewController {
     static async create(req: Request, res: Response) {
       try {
         const { candidateName, sectionConfigs, selectedQuestions } = req.body;

         if (!candidateName || !sectionConfigs || !selectedQuestions) {
           return res.status(400).json({ error: 'candidateName, sectionConfigs, and selectedQuestions required' });
         }

         const interview = await InterviewService.createInterview(
           { candidateName, sectionConfigs, selectedQuestions },
           req.userId!
         );

         res.status(201).json(interview);
       } catch (error) {
         console.error('Create interview error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }

     static async update(req: Request, res: Response) {
       try {
         const { id } = req.params;
         const { candidateName, sectionConfigs, selectedQuestions } = req.body;

         const interview = await InterviewService.updateInterview(
           id,
           { candidateName, sectionConfigs, selectedQuestions },
           req.userId!
         );

         res.json(interview);
       } catch (error: any) {
         if (error.message === 'Interview not found') {
           return res.status(404).json({ error: 'Interview not found' });
         }
         if (error.message === 'Unauthorized') {
           return res.status(403).json({ error: 'Unauthorized' });
         }
         if (error.message === 'Can only edit interviews in SETUP status') {
           return res.status(400).json({ error: error.message });
         }
         console.error('Update interview error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }

     static async getById(req: Request, res: Response) {
       try {
         const { id } = req.params;
         const interview = await InterviewService.getInterview(id, req.userId!);
         res.json(interview);
       } catch (error: any) {
         if (error.message === 'Interview not found') {
           return res.status(404).json({ error: 'Interview not found' });
         }
         if (error.message === 'Unauthorized') {
           return res.status(403).json({ error: 'Unauthorized' });
         }
         console.error('Get interview error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }

     static async list(req: Request, res: Response) {
       try {
         const interviews = await InterviewService.listInterviews(req.userId!);
         res.json(interviews);
       } catch (error) {
         console.error('List interviews error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }
   }
   ```

4. **Create interview routes (server)**

   Create `server/src/routes/interview-routes.ts`:
   ```typescript
   import { Router } from 'express';
   import { InterviewController } from '../controllers/interview-controller';
   import { authMiddleware } from '../middleware/auth-middleware';

   const router = Router();

   router.use(authMiddleware);

   router.post('/', InterviewController.create);
   router.get('/', InterviewController.list);
   router.get('/:id', InterviewController.getById);
   router.put('/:id', InterviewController.update);

   export default router;
   ```

5. **Register routes (server)**

   Modify `server/src/index.ts`:
   ```typescript
   import interviewRoutes from './routes/interview-routes';
   // ...
   app.use('/api/interviews', interviewRoutes);
   ```

6. **Create interview types (client)**

   Create `client/src/types/interview.ts`:
   ```typescript
   export type SessionStatus = 'SETUP' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

   export interface Interview {
     id: string;
     interviewerId: string;
     candidateName: string;
     date: string;
     status: SessionStatus;
     sectionConfigs: SectionConfig[];
     selectedQuestions: InterviewQuestion[];
   }

   export interface SectionConfig {
     id: string;
     sectionId: string;
     durationMinutes: number;
     order: number;
     section: {
       id: string;
       name: string;
       description: string;
       defaultDuration: number;
     };
   }

   export interface InterviewQuestion {
     id: string;
     questionId: string;
     order: number;
     question: {
       id: string;
       text: string;
       answer: string;
       difficulty: string;
       section: { name: string };
     };
   }
   ```

7. **Create interview service (client)**

   Create `client/src/services/interview-service.ts`:
   ```typescript
   import apiClient from './api-client';
   import { Interview } from '../types/interview';

   export const interviewService = {
     async create(data: {
       candidateName: string;
       sectionConfigs: { sectionId: string; durationMinutes: number }[];
       selectedQuestions: { questionId: string; order: number }[];
     }) {
       const response = await apiClient.post<Interview>('/interviews', data);
       return response.data;
     },

     async update(id: string, data: any) {
       const response = await apiClient.put<Interview>(`/interviews/${id}`, data);
       return response.data;
     },

     async getById(id: string) {
       const response = await apiClient.get<Interview>(`/interviews/${id}`);
       return response.data;
     },

     async list() {
       const response = await apiClient.get<Interview[]>('/interviews');
       return response.data;
     },
   };
   ```

8. **Create step indicator component (client)**

   Create `client/src/components/step-indicator.tsx`:
   ```tsx
   import styled from 'styled-components';

   const Container = styled.div`
     display: flex;
     justify-content: space-between;
     margin-bottom: 32px;
   `;

   const Step = styled.div<{ active: boolean; completed: boolean }>`
     flex: 1;
     text-align: center;
     padding: 12px;
     border-bottom: 3px solid ${({ active, completed }) =>
       completed ? '#28a745' : active ? '#007bff' : '#e0e0e0'};
     color: ${({ active, completed }) =>
       completed ? '#28a745' : active ? '#007bff' : '#666'};
     font-weight: ${({ active }) => (active ? '600' : '400')};
   `;

   interface Props {
     currentStep: number;
     steps: string[];
   }

   export const StepIndicator = ({ currentStep, steps }: Props) => (
     <Container>
       {steps.map((step, idx) => (
         <Step key={idx} active={idx === currentStep} completed={idx < currentStep}>
           {idx + 1}. {step}
         </Step>
       ))}
     </Container>
   );
   ```

9. **Create interview setup page (client)**

   Create `client/src/pages/interview-setup-page.tsx`:
   ```tsx
   import { useState, useEffect } from 'react';
   import styled from 'styled-components';
   import { useNavigate } from 'react-router-dom';
   import { interviewService } from '../services/interview-service';
   import { sectionService } from '../services/section-service';
   import { questionService } from '../services/question-service';
   import { Section } from '../types/section';
   import { Question } from '../types/question';
   import { StepIndicator } from '../components/step-indicator';

   const Container = styled.div`
     max-width: 900px;
     margin: 0 auto;
     padding: 24px;
   `;

   const Input = styled.input`
     width: 100%;
     padding: 12px;
     border: 1px solid #ccc;
     border-radius: 4px;
     font-size: 16px;
   `;

   const SectionGroup = styled.div`
     margin-bottom: 24px;
     border: 1px solid #e0e0e0;
     border-radius: 8px;
     padding: 16px;
   `;

   const QuestionItem = styled.label`
     display: flex;
     align-items: center;
     padding: 8px;
     cursor: pointer;

     &:hover {
       background: #f8f9fa;
     }
   `;

   const TimeInput = styled.input`
     width: 80px;
     padding: 8px;
     border: 1px solid #ccc;
     border-radius: 4px;
   `;

   const Actions = styled.div`
     display: flex;
     justify-content: space-between;
     margin-top: 32px;
   `;

   export const InterviewSetupPage = () => {
     const navigate = useNavigate();
     const [step, setStep] = useState(0);
     const [candidateName, setCandidateName] = useState('');
     const [sections, setSections] = useState<Section[]>([]);
     const [questionsBySectionId, setQuestionsBySectionId] = useState<Record<string, Question[]>>({});
     const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
     const [sectionTimes, setSectionTimes] = useState<Record<string, number>>({});

     useEffect(() => {
       loadSections();
     }, []);

     useEffect(() => {
       if (sections.length > 0 && step === 1) {
         loadQuestions();
       }
     }, [sections, step]);

     const loadSections = async () => {
       const data = await sectionService.list();
       setSections(data);
       // Initialize section times with defaults
       const times: Record<string, number> = {};
       data.forEach(s => times[s.id] = s.defaultDuration);
       setSectionTimes(times);
     };

     const loadQuestions = async () => {
       const allQuestions = await questionService.list({});
       const bySection: Record<string, Question[]> = {};
       allQuestions.questions.forEach(q => {
         if (!bySection[q.sectionId]) bySection[q.sectionId] = [];
         bySection[q.sectionId].push(q);
       });
       setQuestionsBySectionId(bySection);
     };

     const toggleQuestion = (questionId: string) => {
       const updated = new Set(selectedQuestionIds);
       if (updated.has(questionId)) {
         updated.delete(questionId);
       } else {
         updated.add(questionId);
       }
       setSelectedQuestionIds(updated);
     };

     const handleSave = async () => {
       const sectionConfigs = sections.map(s => ({
         sectionId: s.id,
         durationMinutes: sectionTimes[s.id],
       }));

       const selectedQuestions = Array.from(selectedQuestionIds).map((id, idx) => ({
         questionId: id,
         order: idx + 1,
       }));

       await interviewService.create({
         candidateName,
         sectionConfigs,
         selectedQuestions,
       });

       alert('Interview created! Redirecting to live mode...');
       navigate('/interviews');
     };

     const steps = ['Candidate Name', 'Select Questions', 'Configure Time'];

     return (
       <Container>
         <h1>Setup Interview</h1>
         <StepIndicator currentStep={step} steps={steps} />

         {step === 0 && (
           <div>
             <h2>Candidate Name</h2>
             <Input
               placeholder="Enter candidate name"
               value={candidateName}
               onChange={(e) => setCandidateName(e.target.value)}
             />
           </div>
         )}

         {step === 1 && (
           <div>
             <h2>Select Questions</h2>
             {sections.map(section => (
               <SectionGroup key={section.id}>
                 <h3>{section.name}</h3>
                 {questionsBySectionId[section.id]?.map(q => (
                   <QuestionItem key={q.id}>
                     <input
                       type="checkbox"
                       checked={selectedQuestionIds.has(q.id)}
                       onChange={() => toggleQuestion(q.id)}
                     />
                     <span style={{ marginLeft: 8 }}>{q.text.substring(0, 80)}...</span>
                   </QuestionItem>
                 )) || <p>No questions available</p>}
               </SectionGroup>
             ))}
           </div>
         )}

         {step === 2 && (
           <div>
             <h2>Configure Time Allocation</h2>
             {sections.map(section => (
               <SectionGroup key={section.id}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <strong>{section.name}</strong>
                     <p style={{ color: '#666', fontSize: 14 }}>{section.description}</p>
                   </div>
                   <div>
                     <TimeInput
                       type="number"
                       min="1"
                       max="60"
                       value={sectionTimes[section.id]}
                       onChange={(e) => setSectionTimes({ ...sectionTimes, [section.id]: parseInt(e.target.value) })}
                     />
                     <span style={{ marginLeft: 8 }}>minutes</span>
                   </div>
                 </div>
               </SectionGroup>
             ))}
           </div>
         )}

         <Actions>
           {step > 0 && <button onClick={() => setStep(step - 1)}>Back</button>}
           {step < steps.length - 1 ? (
             <button onClick={() => setStep(step + 1)} disabled={step === 0 && !candidateName}>
               Next
             </button>
           ) : (
             <button onClick={handleSave} disabled={selectedQuestionIds.size === 0}>
               Save & Start Interview
             </button>
           )}
         </Actions>
       </Container>
     );
   };
   ```

## Todo List

- [ ] Create interview DTO types (server)
- [ ] Implement interview service with transaction support
- [ ] Create interview controller with validation
- [ ] Define interview routes with auth
- [ ] Register interview routes in main server
- [ ] Create interview types (client)
- [ ] Create interview API client service
- [ ] Create StepIndicator component
- [ ] Build CandidateNameForm (step 1)
- [ ] Build QuestionSelectionPanel (step 2)
- [ ] Build TimeConfigurationPanel (step 3)
- [ ] Create InterviewSetupPage with wizard flow
- [ ] Test create interview flow end-to-end
- [ ] Test update interview in SETUP status
- [ ] Verify cannot update interview in other statuses
- [ ] Test validation (candidate name required, min 1 question)
- [ ] Verify section configs saved with correct order
- [ ] Verify questions saved with correct order

## Success Criteria

- Wizard progresses through 3 steps sequentially
- Candidate name required to proceed from step 1
- Questions grouped by section in step 2
- Selected questions tracked across steps
- Time defaults populated from section config
- Save creates interview with status SETUP
- Transaction ensures atomic creation (all or nothing)
- Can edit interview in SETUP status
- Cannot edit interview in other statuses (400 error)
- Interview list shows all user's interviews ordered by date

## Risk Assessment

**Risk:** Prisma transaction fails midway
**Mitigation:** Wrapped in $transaction for atomicity, rollback on error

**Risk:** User selects too many questions (performance)
**Mitigation:** No limit for MVP, add warning if >50 questions in future

**Risk:** Step navigation loses state
**Mitigation:** Keep all state at top level (InterviewSetupPage)

## Security Considerations

- Only interviewer who created session can view/edit it
- Status check prevents editing live/completed interviews
- Auth middleware validates JWT on all endpoints
- Transaction prevents partial data creation

## Next Steps

Proceed to **Phase 07: Live Interview Mode** to build the real-time interview interface with timer, question display, scoring, and auto-save functionality.
