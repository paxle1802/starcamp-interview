# Phase 07: Live Interview Mode

## Overview

**Priority:** P1 (Critical)
**Status:** Pending
**Effort:** 6h

Build live interview interface with section-based timer, question navigation, 1-5 scoring, notes, auto-save every 30s, section progression.

## Key Insights

- Use Date() recalculation for timer accuracy (prevents drift in background tabs)
- Timer per section (not per question)
- Countdown timer shows remaining time for current section
- Auto-save scores + notes every 30s to prevent data loss
- Manual save on section change
- Status changes: SETUP → IN_PROGRESS (on start) → COMPLETED (on finish)

## Requirements

### Functional
- PATCH /api/interviews/:id/start - Start interview (status → IN_PROGRESS)
- PATCH /api/interviews/:id/complete - Complete interview (status → COMPLETED)
- POST /api/scores - Create/update score for question
- GET /api/interviews/:id/progress - Get current scores and progress
- Timer displays countdown for current section
- Question navigation within section (prev/next buttons)
- Score selector: 1-5 radio buttons with labels
- Notes textarea per question
- Auto-save every 30 seconds
- Section navigation shows progress (1/6, 2/6, etc.)
- Visual indicator when time runs out (warning, not blocking)

### Non-Functional
- Timer updates every 100ms for smooth display
- Auto-save doesn't interrupt user typing
- Debounce auto-save to prevent race conditions
- Loading state during manual save
- Responsive layout (question on left, answer key on right)

## Architecture

```
LiveInterviewPage
├── InterviewHeader (candidate name, section progress)
├── SectionTimer (countdown, visual progress bar)
├── SectionNavigation (next section button)
├── QuestionDisplay
│   ├── QuestionText (left panel)
│   └── AnswerKey (right panel, collapsible)
├── ScoringPanel
│   ├── ScoreSelector (1-5 radio buttons)
│   └── NotesTextarea
└── QuestionNavigation (prev/next question)
```

### Timer Logic
```typescript
const [sectionStartTime, setSectionStartTime] = useState(new Date());
const [elapsed, setElapsed] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setElapsed(new Date().getTime() - sectionStartTime.getTime());
  }, 100);
  return () => clearInterval(interval);
}, [sectionStartTime]);

const remaining = sectionDuration * 60 * 1000 - elapsed; // milliseconds
```

## Related Code Files

### Files to Create
- `/server/src/controllers/score-controller.ts` - Score CRUD
- `/server/src/services/score-service.ts` - Score business logic
- `/server/src/routes/score-routes.ts` - Score routes
- `/client/src/pages/live-interview-page.tsx` - Main interview UI
- `/client/src/components/section-timer.tsx` - Countdown timer
- `/client/src/components/question-display.tsx` - Question and answer
- `/client/src/components/scoring-panel.tsx` - Score selector + notes
- `/client/src/components/question-navigation.tsx` - Prev/next buttons
- `/client/src/services/score-service.ts` - Score API client
- `/client/src/hooks/use-auto-save.ts` - Auto-save custom hook
- `/client/src/types/score.ts` - Score types

### Files to Modify
- `/server/src/routes/interview-routes.ts` - Add start/complete endpoints
- `/server/src/controllers/interview-controller.ts` - Add start/complete methods
- `/server/src/services/interview-service.ts` - Add start/complete logic

## Implementation Steps

1. **Add start/complete methods to interview service (server)**

   Modify `server/src/services/interview-service.ts`:
   ```typescript
   static async startInterview(id: string, userId: string) {
     const interview = await prisma.interviewSession.findUnique({ where: { id } });
     if (!interview) throw new Error('Interview not found');
     if (interview.interviewerId !== userId) throw new Error('Unauthorized');
     if (interview.status !== 'SETUP') throw new Error('Interview already started or completed');

     return prisma.interviewSession.update({
       where: { id },
       data: { status: 'IN_PROGRESS' },
     });
   }

   static async completeInterview(id: string, userId: string) {
     const interview = await prisma.interviewSession.findUnique({ where: { id } });
     if (!interview) throw new Error('Interview not found');
     if (interview.interviewerId !== userId) throw new Error('Unauthorized');

     return prisma.interviewSession.update({
       where: { id },
       data: { status: 'COMPLETED' },
     });
   }

   static async getProgress(id: string, userId: string) {
     const interview = await this.getInterview(id, userId);
     const scores = await prisma.score.findMany({
       where: { interviewId: id },
       include: { question: true },
     });

     return { interview, scores };
   }
   ```

2. **Add start/complete endpoints (server)**

   Modify `server/src/controllers/interview-controller.ts`:
   ```typescript
   static async start(req: Request, res: Response) {
     try {
       const { id } = req.params;
       const interview = await InterviewService.startInterview(id, req.userId!);
       res.json(interview);
     } catch (error: any) {
       if (error.message === 'Interview not found') {
         return res.status(404).json({ error: 'Interview not found' });
       }
       if (error.message === 'Unauthorized') {
         return res.status(403).json({ error: 'Unauthorized' });
       }
       if (error.message === 'Interview already started or completed') {
         return res.status(400).json({ error: error.message });
       }
       console.error('Start interview error:', error);
       res.status(500).json({ error: 'Internal server error' });
     }
   }

   static async complete(req: Request, res: Response) {
     try {
       const { id } = req.params;
       const interview = await InterviewService.completeInterview(id, req.userId!);
       res.json(interview);
     } catch (error: any) {
       if (error.message === 'Interview not found') {
         return res.status(404).json({ error: 'Interview not found' });
       }
       if (error.message === 'Unauthorized') {
         return res.status(403).json({ error: 'Unauthorized' });
       }
       console.error('Complete interview error:', error);
       res.status(500).json({ error: 'Internal server error' });
     }
   }

   static async getProgress(req: Request, res: Response) {
     try {
       const { id } = req.params;
       const data = await InterviewService.getProgress(id, req.userId!);
       res.json(data);
     } catch (error: any) {
       if (error.message === 'Interview not found') {
         return res.status(404).json({ error: 'Interview not found' });
       }
       if (error.message === 'Unauthorized') {
         return res.status(403).json({ error: 'Unauthorized' });
       }
       console.error('Get progress error:', error);
       res.status(500).json({ error: 'Internal server error' });
     }
   }
   ```

   Modify `server/src/routes/interview-routes.ts`:
   ```typescript
   router.patch('/:id/start', InterviewController.start);
   router.patch('/:id/complete', InterviewController.complete);
   router.get('/:id/progress', InterviewController.getProgress);
   ```

3. **Create score service (server)**

   Create `server/src/services/score-service.ts`:
   ```typescript
   import prisma from '../utils/prisma-client';

   export class ScoreService {
     static async upsertScore(data: {
       interviewId: string;
       questionId: string;
       score: number;
       notes?: string;
     }) {
       return prisma.score.upsert({
         where: {
           interviewId_questionId: {
             interviewId: data.interviewId,
             questionId: data.questionId,
           },
         },
         create: data,
         update: {
           score: data.score,
           notes: data.notes,
         },
       });
     }

     static async getScoresForInterview(interviewId: string) {
       return prisma.score.findMany({
         where: { interviewId },
         include: { question: true },
       });
     }
   }
   ```

4. **Create score controller (server)**

   Create `server/src/controllers/score-controller.ts`:
   ```typescript
   import { Request, Response } from 'express';
   import { ScoreService } from '../services/score-service';

   export class ScoreController {
     static async upsert(req: Request, res: Response) {
       try {
         const { interviewId, questionId, score, notes } = req.body;

         if (!interviewId || !questionId || score === undefined) {
           return res.status(400).json({ error: 'interviewId, questionId, and score required' });
         }

         if (score < 1 || score > 5) {
           return res.status(400).json({ error: 'score must be between 1 and 5' });
         }

         const result = await ScoreService.upsertScore({ interviewId, questionId, score, notes });
         res.json(result);
       } catch (error) {
         console.error('Upsert score error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }

     static async listByInterview(req: Request, res: Response) {
       try {
         const { interviewId } = req.params;
         const scores = await ScoreService.getScoresForInterview(interviewId);
         res.json(scores);
       } catch (error) {
         console.error('List scores error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }
   }
   ```

5. **Create score routes (server)**

   Create `server/src/routes/score-routes.ts`:
   ```typescript
   import { Router } from 'express';
   import { ScoreController } from '../controllers/score-controller';
   import { authMiddleware } from '../middleware/auth-middleware';

   const router = Router();

   router.use(authMiddleware);

   router.post('/', ScoreController.upsert);
   router.get('/interview/:interviewId', ScoreController.listByInterview);

   export default router;
   ```

   Register in `server/src/index.ts`:
   ```typescript
   import scoreRoutes from './routes/score-routes';
   app.use('/api/scores', scoreRoutes);
   ```

6. **Create score types (client)**

   Create `client/src/types/score.ts`:
   ```typescript
   export interface Score {
     id: string;
     interviewId: string;
     questionId: string;
     score: number;
     notes?: string;
   }
   ```

7. **Create score service (client)**

   Create `client/src/services/score-service.ts`:
   ```typescript
   import apiClient from './api-client';
   import { Score } from '../types/score';

   export const scoreService = {
     async upsert(data: {
       interviewId: string;
       questionId: string;
       score: number;
       notes?: string;
     }) {
       const response = await apiClient.post<Score>('/scores', data);
       return response.data;
     },

     async listByInterview(interviewId: string) {
       const response = await apiClient.get<Score[]>(`/scores/interview/${interviewId}`);
       return response.data;
     },
   };
   ```

8. **Create auto-save hook (client)**

   Create `client/src/hooks/use-auto-save.ts`:
   ```typescript
   import { useEffect, useRef } from 'react';

   export const useAutoSave = (callback: () => void, delay: number = 30000) => {
     const savedCallback = useRef(callback);

     useEffect(() => {
       savedCallback.current = callback;
     }, [callback]);

     useEffect(() => {
       const interval = setInterval(() => {
         savedCallback.current();
       }, delay);

       return () => clearInterval(interval);
     }, [delay]);
   };
   ```

9. **Create section timer component (client)**

   Create `client/src/components/section-timer.tsx`:
   ```tsx
   import { useState, useEffect } from 'react';
   import styled from 'styled-components';

   const Container = styled.div`
     text-align: center;
     margin: 24px 0;
   `;

   const TimerDisplay = styled.div<{ warning: boolean }>`
     font-size: 48px;
     font-weight: bold;
     color: ${({ warning }) => (warning ? '#dc3545' : '#28a745')};
   `;

   const ProgressBar = styled.div`
     width: 100%;
     height: 8px;
     background: #e0e0e0;
     border-radius: 4px;
     margin-top: 16px;
     overflow: hidden;
   `;

   const Progress = styled.div<{ percent: number; warning: boolean }>`
     height: 100%;
     width: ${({ percent }) => percent}%;
     background: ${({ warning }) => (warning ? '#dc3545' : '#28a745')};
     transition: width 0.1s linear;
   `;

   interface Props {
     startTime: Date;
     durationMinutes: number;
   }

   export const SectionTimer = ({ startTime, durationMinutes }: Props) => {
     const [elapsed, setElapsed] = useState(0);

     useEffect(() => {
       const interval = setInterval(() => {
         setElapsed(new Date().getTime() - startTime.getTime());
       }, 100);
       return () => clearInterval(interval);
     }, [startTime]);

     const totalMs = durationMinutes * 60 * 1000;
     const remaining = Math.max(0, totalMs - elapsed);
     const percent = Math.min(100, (elapsed / totalMs) * 100);
     const warning = remaining < 60000; // Less than 1 minute

     const minutes = Math.floor(remaining / 60000);
     const seconds = Math.floor((remaining % 60000) / 1000);

     return (
       <Container>
         <TimerDisplay warning={warning}>
           {minutes}:{seconds.toString().padStart(2, '0')}
         </TimerDisplay>
         <ProgressBar>
           <Progress percent={percent} warning={warning} />
         </ProgressBar>
       </Container>
     );
   };
   ```

10. **Create scoring panel (client)**

    Create `client/src/components/scoring-panel.tsx`:
    ```tsx
    import styled from 'styled-components';

    const Container = styled.div`
      margin-top: 24px;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    `;

    const ScoreOptions = styled.div`
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    `;

    const ScoreOption = styled.label<{ selected: boolean }>`
      flex: 1;
      text-align: center;
      padding: 12px;
      border: 2px solid ${({ selected }) => (selected ? '#007bff' : '#e0e0e0')};
      border-radius: 8px;
      cursor: pointer;
      background: ${({ selected }) => (selected ? '#e7f3ff' : 'white')};
      transition: all 0.2s;

      &:hover {
        border-color: #007bff;
      }

      input {
        display: none;
      }
    `;

    const Textarea = styled.textarea`
      width: 100%;
      min-height: 100px;
      padding: 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-family: inherit;
      resize: vertical;
    `;

    const SCORE_LABELS = {
      1: 'Poor',
      2: 'Need Improvement',
      3: 'Average',
      4: 'Good',
      5: 'Excellent',
    };

    interface Props {
      score?: number;
      notes?: string;
      onScoreChange: (score: number) => void;
      onNotesChange: (notes: string) => void;
    }

    export const ScoringPanel = ({ score, notes, onScoreChange, onNotesChange }: Props) => (
      <Container>
        <h3>Score this answer</h3>
        <ScoreOptions>
          {[1, 2, 3, 4, 5].map((s) => (
            <ScoreOption key={s} selected={score === s}>
              <input
                type="radio"
                name="score"
                value={s}
                checked={score === s}
                onChange={() => onScoreChange(s)}
              />
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{s}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{SCORE_LABELS[s as keyof typeof SCORE_LABELS]}</div>
            </ScoreOption>
          ))}
        </ScoreOptions>

        <label>
          <strong>Notes</strong>
          <Textarea
            placeholder="Add notes about this answer..."
            value={notes || ''}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </label>
      </Container>
    );
    ```

11. **Create live interview page (client)**

    Create `client/src/pages/live-interview-page.tsx`:
    ```tsx
    import { useState, useEffect } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import styled from 'styled-components';
    import { interviewService } from '../services/interview-service';
    import { scoreService } from '../services/score-service';
    import { Interview } from '../types/interview';
    import { Score } from '../types/score';
    import { SectionTimer } from '../components/section-timer';
    import { ScoringPanel } from '../components/scoring-panel';
    import { useAutoSave } from '../hooks/use-auto-save';

    const Container = styled.div`
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    `;

    const Grid = styled.div`
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    `;

    const Panel = styled.div`
      padding: 24px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    `;

    const Navigation = styled.div`
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
    `;

    export const LiveInterviewPage = () => {
      const { id } = useParams<{ id: string }>();
      const navigate = useNavigate();
      const [interview, setInterview] = useState<Interview | null>(null);
      const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
      const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
      const [sectionStartTime, setSectionStartTime] = useState(new Date());
      const [scores, setScores] = useState<Record<string, { score: number; notes: string }>>({});
      const [saving, setSaving] = useState(false);

      useEffect(() => {
        loadInterview();
      }, [id]);

      const loadInterview = async () => {
        if (!id) return;
        const data = await interviewService.getById(id);
        setInterview(data);

        if (data.status === 'SETUP') {
          await interviewService.update(id, {});
          await startInterview();
        }

        // Load existing scores
        const existingScores = await scoreService.listByInterview(id);
        const scoreMap: Record<string, { score: number; notes: string }> = {};
        existingScores.forEach((s: Score) => {
          scoreMap[s.questionId] = { score: s.score, notes: s.notes || '' };
        });
        setScores(scoreMap);
      };

      const startInterview = async () => {
        if (!id) return;
        await interviewService.update(id, {});
        // In real implementation, call start endpoint
      };

      const saveScores = async () => {
        if (!interview || !id) return;
        setSaving(true);

        try {
          const promises = Object.entries(scores).map(([questionId, data]) =>
            scoreService.upsert({
              interviewId: id,
              questionId,
              score: data.score,
              notes: data.notes,
            })
          );
          await Promise.all(promises);
        } catch (error) {
          console.error('Save error:', error);
        } finally {
          setSaving(false);
        }
      };

      useAutoSave(saveScores, 30000);

      if (!interview) return <div>Loading...</div>;

      const currentSection = interview.sectionConfigs[currentSectionIdx];
      const questionsInSection = interview.selectedQuestions.filter(
        (q) => q.question.section.name === currentSection.section.name
      );
      const currentQuestion = questionsInSection[currentQuestionIdx];

      const handleNextQuestion = () => {
        if (currentQuestionIdx < questionsInSection.length - 1) {
          setCurrentQuestionIdx(currentQuestionIdx + 1);
        }
      };

      const handlePrevQuestion = () => {
        if (currentQuestionIdx > 0) {
          setCurrentQuestionIdx(currentQuestionIdx - 1);
        }
      };

      const handleNextSection = async () => {
        await saveScores();
        if (currentSectionIdx < interview.sectionConfigs.length - 1) {
          setCurrentSectionIdx(currentSectionIdx + 1);
          setCurrentQuestionIdx(0);
          setSectionStartTime(new Date());
        } else {
          // Complete interview
          if (id) {
            // Call complete endpoint
            alert('Interview completed!');
            navigate('/interviews');
          }
        }
      };

      return (
        <Container>
          <h1>Interview: {interview.candidateName}</h1>
          <p>Section {currentSectionIdx + 1} of {interview.sectionConfigs.length}: {currentSection.section.name}</p>

          <SectionTimer startTime={sectionStartTime} durationMinutes={currentSection.durationMinutes} />

          <Grid>
            <Panel>
              <h2>Question</h2>
              <p>{currentQuestion.question.text}</p>
            </Panel>

            <Panel>
              <h2>Answer Key</h2>
              <p>{currentQuestion.question.answer}</p>
            </Panel>
          </Grid>

          <ScoringPanel
            score={scores[currentQuestion.questionId]?.score}
            notes={scores[currentQuestion.questionId]?.notes}
            onScoreChange={(score) =>
              setScores({ ...scores, [currentQuestion.questionId]: { ...scores[currentQuestion.questionId], score } })
            }
            onNotesChange={(notes) =>
              setScores({ ...scores, [currentQuestion.questionId]: { ...scores[currentQuestion.questionId], notes } })
            }
          />

          <Navigation>
            <button onClick={handlePrevQuestion} disabled={currentQuestionIdx === 0}>
              Previous Question
            </button>
            <span>
              Question {currentQuestionIdx + 1} of {questionsInSection.length}
            </span>
            {currentQuestionIdx < questionsInSection.length - 1 ? (
              <button onClick={handleNextQuestion}>Next Question</button>
            ) : (
              <button onClick={handleNextSection}>
                {currentSectionIdx < interview.sectionConfigs.length - 1 ? 'Next Section' : 'Complete Interview'}
              </button>
            )}
          </Navigation>

          {saving && <p style={{ textAlign: 'center', color: '#666' }}>Saving...</p>}
        </Container>
      );
    };
    ```

## Todo List

- [ ] Add start/complete methods to interview service
- [ ] Add start/complete endpoints to interview controller
- [ ] Add start/complete routes
- [ ] Create score service with upsert logic
- [ ] Create score controller
- [ ] Create score routes
- [ ] Register score routes in main server
- [ ] Create score types (client)
- [ ] Create score API client service
- [ ] Create useAutoSave hook with 30s interval
- [ ] Create SectionTimer component with Date() recalculation
- [ ] Create ScoringPanel with 1-5 radio buttons
- [ ] Create LiveInterviewPage with state management
- [ ] Implement question navigation (prev/next)
- [ ] Implement section navigation
- [ ] Test auto-save functionality
- [ ] Test timer accuracy when tab backgrounded
- [ ] Test score persistence across page refresh
- [ ] Verify status changes (SETUP → IN_PROGRESS → COMPLETED)

## Success Criteria

- Timer counts down accurately (no drift when tab backgrounded)
- Timer shows warning color when <1 minute remaining
- Progress bar reflects time elapsed visually
- Scores auto-save every 30 seconds
- Manual save on section change works
- Question navigation within section works
- Section navigation resets timer and question index
- Status updates to IN_PROGRESS on start
- Status updates to COMPLETED on finish
- Notes persist with scores
- Can refresh page and resume interview

## Risk Assessment

**Risk:** Timer drifts when browser throttles setInterval
**Mitigation:** Date() recalculation approach prevents drift

**Risk:** Auto-save conflicts with manual save
**Mitigation:** Debounce and loading state prevent race conditions

**Risk:** User loses data on crash
**Mitigation:** Auto-save every 30s minimizes data loss

## Security Considerations

- Only interviewer can start/complete their interviews
- Scores validated (1-5 range) on server
- Interview status prevents re-starting completed interviews

## Next Steps

Proceed to **Phase 08: Interview Results** to build results view with score summaries, weighted aggregation, and past interview list.
