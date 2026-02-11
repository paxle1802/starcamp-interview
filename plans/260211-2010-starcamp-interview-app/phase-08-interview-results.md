# Phase 08: Interview Results

## Overview

**Priority:** P1 (Critical)
**Status:** Pending
**Effort:** 4h

Build results view showing interview scorecard with per-question scores, per-section averages, weighted overall score, and list of past interviews.

## Key Insights

- Section scores calculated as average of question scores within section
- Overall score weighted by section importance (configurable weights)
- Results read-only (no editing after completion)
- Display candidate name, date, duration, status
- Color-coded scores (red <3, yellow 3-3.9, green ≥4)
- Past interviews filterable by status and date range

## Requirements

### Functional
- GET /api/interviews/:id/results - Get detailed scorecard
- Results page shows:
  - Candidate name, date, total duration
  - Per-section breakdown (questions, scores, average)
  - Overall weighted score
  - Notes for each question
- Interview list page with filters (status, date range)
- Click interview to view results
- Export buttons (PDF, Excel) visible on results page

### Non-Functional
- Scores displayed as X.X/5.0 format
- Color coding: <3.0 red, 3.0-3.9 yellow, ≥4.0 green
- Section weights configurable (default all equal)
- Responsive table layout
- Empty state when no interviews exist

## Architecture

```
InterviewResultsPage
├── ResultsHeader (candidate, date, status)
├── OverallScoreCard (weighted average, visual gauge)
├── SectionScoreCard[] (per section)
│   ├── SectionHeader (name, avg score, weight)
│   └── QuestionScoreTable
│       └── QuestionScoreRow[] (question, score, notes)
└── ExportButtons (PDF, Excel)
```

### Score Calculation
```typescript
// Per-section average
sectionScore = sum(questionScores) / questionCount

// Weighted overall score
overallScore = sum(sectionScore × sectionWeight) / sum(sectionWeights)
```

## Related Code Files

### Files to Create
- `/server/src/services/results-service.ts` - Results calculation logic
- `/server/src/controllers/results-controller.ts` - Results endpoint
- `/server/src/routes/results-routes.ts` - Results routes
- `/client/src/pages/interview-results-page.tsx` - Results view
- `/client/src/pages/interview-list-page.tsx` - Past interviews list
- `/client/src/components/overall-score-card.tsx` - Overall score display
- `/client/src/components/section-score-card.tsx` - Section breakdown
- `/client/src/components/question-score-row.tsx` - Question score row
- `/client/src/components/score-gauge.tsx` - Visual score indicator
- `/client/src/services/results-service.ts` - Results API client
- `/client/src/types/results.ts` - Results types
- `/client/src/utils/score-calculator.ts` - Client-side score utils

### Files to Modify
- `/server/src/index.ts` - Register results routes

## Implementation Steps

1. **Create results types (server)**

   Create `server/src/types/results-types.ts`:
   ```typescript
   export interface QuestionScore {
     questionId: string;
     questionText: string;
     score: number;
     notes?: string;
   }

   export interface SectionResult {
     sectionId: string;
     sectionName: string;
     averageScore: number;
     weight: number;
     questionScores: QuestionScore[];
   }

   export interface InterviewResults {
     interviewId: string;
     candidateName: string;
     date: Date;
     status: string;
     sectionResults: SectionResult[];
     overallScore: number;
     totalQuestions: number;
     answeredQuestions: number;
   }
   ```

2. **Create results service (server)**

   Create `server/src/services/results-service.ts`:
   ```typescript
   import prisma from '../utils/prisma-client';
   import { InterviewResults, SectionResult } from '../types/results-types';

   const DEFAULT_SECTION_WEIGHTS: Record<string, number> = {
     'Introduction': 0.5,
     'CS Foundations': 1.5,
     'Whiteboard Coding': 2.0,
     'Technical Skills': 1.5,
     'Mindset & Collaboration': 1.0,
     'Wrap-up': 0.5,
   };

   export class ResultsService {
     static async calculateResults(interviewId: string, userId: string): Promise<InterviewResults> {
       const interview = await prisma.interviewSession.findUnique({
         where: { id: interviewId },
         include: {
           sectionConfigs: {
             include: { section: true },
             orderBy: { order: 'asc' },
           },
           selectedQuestions: {
             include: { question: true },
             orderBy: { order: 'asc' },
           },
         },
       });

       if (!interview) throw new Error('Interview not found');
       if (interview.interviewerId !== userId) throw new Error('Unauthorized');

       const scores = await prisma.score.findMany({
         where: { interviewId },
         include: { question: true },
       });

       const scoreMap = new Map(scores.map(s => [s.questionId, s]));

       // Group questions by section
       const questionsBySection = new Map<string, any[]>();
       interview.selectedQuestions.forEach(iq => {
         const sectionName = iq.question.section?.name || 'Unknown';
         if (!questionsBySection.has(sectionName)) {
           questionsBySection.set(sectionName, []);
         }
         questionsBySection.get(sectionName)!.push(iq);
       });

       // Calculate section results
       const sectionResults: SectionResult[] = [];
       let totalWeightedScore = 0;
       let totalWeight = 0;

       interview.sectionConfigs.forEach(sc => {
         const questions = questionsBySection.get(sc.section.name) || [];
         const questionScores = questions.map(q => {
           const score = scoreMap.get(q.questionId);
           return {
             questionId: q.questionId,
             questionText: q.question.text,
             score: score?.score || 0,
             notes: score?.notes,
           };
         });

         const avgScore = questionScores.length > 0
           ? questionScores.reduce((sum, qs) => sum + qs.score, 0) / questionScores.length
           : 0;

         const weight = DEFAULT_SECTION_WEIGHTS[sc.section.name] || 1;

         sectionResults.push({
           sectionId: sc.sectionId,
           sectionName: sc.section.name,
           averageScore: avgScore,
           weight,
           questionScores,
         });

         totalWeightedScore += avgScore * weight;
         totalWeight += weight;
       });

       const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

       return {
         interviewId: interview.id,
         candidateName: interview.candidateName,
         date: interview.date,
         status: interview.status,
         sectionResults,
         overallScore,
         totalQuestions: interview.selectedQuestions.length,
         answeredQuestions: scores.length,
       };
     }
   }
   ```

3. **Create results controller (server)**

   Create `server/src/controllers/results-controller.ts`:
   ```typescript
   import { Request, Response } from 'express';
   import { ResultsService } from '../services/results-service';

   export class ResultsController {
     static async getResults(req: Request, res: Response) {
       try {
         const { id } = req.params;
         const results = await ResultsService.calculateResults(id, req.userId!);
         res.json(results);
       } catch (error: any) {
         if (error.message === 'Interview not found') {
           return res.status(404).json({ error: 'Interview not found' });
         }
         if (error.message === 'Unauthorized') {
           return res.status(403).json({ error: 'Unauthorized' });
         }
         console.error('Get results error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }
   }
   ```

4. **Create results routes (server)**

   Create `server/src/routes/results-routes.ts`:
   ```typescript
   import { Router } from 'express';
   import { ResultsController } from '../controllers/results-controller';
   import { authMiddleware } from '../middleware/auth-middleware';

   const router = Router();

   router.use(authMiddleware);
   router.get('/:id', ResultsController.getResults);

   export default router;
   ```

   Register in `server/src/index.ts`:
   ```typescript
   import resultsRoutes from './routes/results-routes';
   app.use('/api/results', resultsRoutes);
   ```

5. **Create results types (client)**

   Create `client/src/types/results.ts`:
   ```typescript
   export interface QuestionScore {
     questionId: string;
     questionText: string;
     score: number;
     notes?: string;
   }

   export interface SectionResult {
     sectionId: string;
     sectionName: string;
     averageScore: number;
     weight: number;
     questionScores: QuestionScore[];
   }

   export interface InterviewResults {
     interviewId: string;
     candidateName: string;
     date: string;
     status: string;
     sectionResults: SectionResult[];
     overallScore: number;
     totalQuestions: number;
     answeredQuestions: number;
   }
   ```

6. **Create results service (client)**

   Create `client/src/services/results-service.ts`:
   ```typescript
   import apiClient from './api-client';
   import { InterviewResults } from '../types/results';

   export const resultsService = {
     async getResults(interviewId: string) {
       const response = await apiClient.get<InterviewResults>(`/results/${interviewId}`);
       return response.data;
     },
   };
   ```

7. **Create score gauge component (client)**

   Create `client/src/components/score-gauge.tsx`:
   ```tsx
   import styled from 'styled-components';

   const Container = styled.div`
     text-align: center;
   `;

   const Circle = styled.div<{ score: number }>`
     width: 120px;
     height: 120px;
     border-radius: 50%;
     display: flex;
     align-items: center;
     justify-content: center;
     margin: 0 auto 16px;
     background: ${({ score }) =>
       score >= 4.0 ? '#d4edda' :
       score >= 3.0 ? '#fff3cd' :
       '#f8d7da'};
     border: 4px solid ${({ score }) =>
       score >= 4.0 ? '#28a745' :
       score >= 3.0 ? '#ffc107' :
       '#dc3545'};
   `;

   const ScoreText = styled.div<{ score: number }>`
     font-size: 36px;
     font-weight: bold;
     color: ${({ score }) =>
       score >= 4.0 ? '#155724' :
       score >= 3.0 ? '#856404' :
       '#721c24'};
   `;

   interface Props {
     score: number;
   }

   export const ScoreGauge = ({ score }: Props) => (
     <Container>
       <Circle score={score}>
         <ScoreText score={score}>{score.toFixed(1)}</ScoreText>
       </Circle>
       <div>/5.0</div>
     </Container>
   );
   ```

8. **Create section score card (client)**

   Create `client/src/components/section-score-card.tsx`:
   ```tsx
   import styled from 'styled-components';
   import { SectionResult } from '../types/results';

   const Card = styled.div`
     border: 1px solid #e0e0e0;
     border-radius: 8px;
     padding: 16px;
     margin-bottom: 16px;
   `;

   const Header = styled.div`
     display: flex;
     justify-content: space-between;
     align-items: center;
     margin-bottom: 16px;
   `;

   const Table = styled.table`
     width: 100%;
     border-collapse: collapse;
   `;

   const Th = styled.th`
     text-align: left;
     padding: 8px;
     border-bottom: 2px solid #e0e0e0;
   `;

   const Td = styled.td`
     padding: 8px;
     border-bottom: 1px solid #f0f0f0;
   `;

   const ScoreBadge = styled.span<{ score: number }>`
     padding: 4px 12px;
     border-radius: 12px;
     font-weight: 600;
     background: ${({ score }) =>
       score >= 4 ? '#d4edda' :
       score >= 3 ? '#fff3cd' :
       '#f8d7da'};
     color: ${({ score }) =>
       score >= 4 ? '#155724' :
       score >= 3 ? '#856404' :
       '#721c24'};
   `;

   interface Props {
     section: SectionResult;
   }

   export const SectionScoreCard = ({ section }: Props) => (
     <Card>
       <Header>
         <h3>{section.sectionName}</h3>
         <div>
           <span style={{ marginRight: 16 }}>Weight: {section.weight}</span>
           <ScoreBadge score={section.averageScore}>
             Avg: {section.averageScore.toFixed(1)}/5.0
           </ScoreBadge>
         </div>
       </Header>

       <Table>
         <thead>
           <tr>
             <Th>Question</Th>
             <Th>Score</Th>
             <Th>Notes</Th>
           </tr>
         </thead>
         <tbody>
           {section.questionScores.map((qs) => (
             <tr key={qs.questionId}>
               <Td>{qs.questionText.substring(0, 100)}...</Td>
               <Td>
                 <ScoreBadge score={qs.score}>{qs.score}/5</ScoreBadge>
               </Td>
               <Td style={{ fontSize: 14, color: '#666' }}>{qs.notes || '—'}</Td>
             </tr>
           ))}
         </tbody>
       </Table>
     </Card>
   );
   ```

9. **Create interview results page (client)**

   Create `client/src/pages/interview-results-page.tsx`:
   ```tsx
   import { useState, useEffect } from 'react';
   import { useParams } from 'react-router-dom';
   import styled from 'styled-components';
   import { resultsService } from '../services/results-service';
   import { InterviewResults } from '../types/results';
   import { ScoreGauge } from '../components/score-gauge';
   import { SectionScoreCard } from '../components/section-score-card';

   const Container = styled.div`
     max-width: 1200px;
     margin: 0 auto;
     padding: 24px;
   `;

   const Header = styled.div`
     margin-bottom: 32px;
   `;

   const OverallCard = styled.div`
     background: #f8f9fa;
     border-radius: 8px;
     padding: 24px;
     margin-bottom: 32px;
     display: flex;
     justify-content: space-around;
     align-items: center;
   `;

   const Stat = styled.div`
     text-align: center;
   `;

   const ExportButtons = styled.div`
     display: flex;
     gap: 12px;
     margin-top: 24px;
   `;

   export const InterviewResultsPage = () => {
     const { id } = useParams<{ id: string }>();
     const [results, setResults] = useState<InterviewResults | null>(null);

     useEffect(() => {
       loadResults();
     }, [id]);

     const loadResults = async () => {
       if (!id) return;
       const data = await resultsService.getResults(id);
       setResults(data);
     };

     if (!results) return <div>Loading...</div>;

     return (
       <Container>
         <Header>
           <h1>Interview Results: {results.candidateName}</h1>
           <p>Date: {new Date(results.date).toLocaleDateString()}</p>
           <p>Status: {results.status}</p>
         </Header>

         <OverallCard>
           <Stat>
             <ScoreGauge score={results.overallScore} />
             <strong>Overall Score</strong>
           </Stat>

           <Stat>
             <div style={{ fontSize: 48, fontWeight: 'bold' }}>{results.answeredQuestions}</div>
             <div>of {results.totalQuestions} questions answered</div>
           </Stat>

           <Stat>
             <div style={{ fontSize: 48, fontWeight: 'bold' }}>{results.sectionResults.length}</div>
             <div>sections completed</div>
           </Stat>
         </OverallCard>

         <h2>Section Breakdown</h2>
         {results.sectionResults.map((section) => (
           <SectionScoreCard key={section.sectionId} section={section} />
         ))}

         <ExportButtons>
           <button onClick={() => alert('PDF export - Phase 09')}>Export PDF</button>
           <button onClick={() => alert('Excel export - Phase 09')}>Export Excel</button>
         </ExportButtons>
       </Container>
     );
   };
   ```

10. **Create interview list page (client)**

    Create `client/src/pages/interview-list-page.tsx`:
    ```tsx
    import { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import styled from 'styled-components';
    import { interviewService } from '../services/interview-service';
    import { Interview } from '../types/interview';

    const Container = styled.div`
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    `;

    const Table = styled.table`
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
    `;

    const Th = styled.th`
      text-align: left;
      padding: 12px;
      border-bottom: 2px solid #e0e0e0;
      background: #f8f9fa;
    `;

    const Td = styled.td`
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;

      &:hover {
        background: #f8f9fa;
      }
    `;

    const StatusBadge = styled.span<{ status: string }>`
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      background: ${({ status }) =>
        status === 'COMPLETED' ? '#d4edda' :
        status === 'IN_PROGRESS' ? '#fff3cd' :
        '#e7f3ff'};
      color: ${({ status }) =>
        status === 'COMPLETED' ? '#155724' :
        status === 'IN_PROGRESS' ? '#856404' :
        '#004085'};
    `;

    export const InterviewListPage = () => {
      const navigate = useNavigate();
      const [interviews, setInterviews] = useState<Interview[]>([]);

      useEffect(() => {
        loadInterviews();
      }, []);

      const loadInterviews = async () => {
        const data = await interviewService.list();
        setInterviews(data);
      };

      const handleRowClick = (interview: Interview) => {
        if (interview.status === 'COMPLETED') {
          navigate(`/interviews/${interview.id}/results`);
        } else if (interview.status === 'IN_PROGRESS') {
          navigate(`/interviews/${interview.id}/live`);
        } else {
          navigate(`/interviews/${interview.id}/setup`);
        }
      };

      return (
        <Container>
          <h1>Interviews</h1>
          <button onClick={() => navigate('/interviews/new')}>New Interview</button>

          <Table>
            <thead>
              <tr>
                <Th>Candidate</Th>
                <Th>Date</Th>
                <Th>Status</Th>
                <Th>Sections</Th>
              </tr>
            </thead>
            <tbody>
              {interviews.length === 0 ? (
                <tr>
                  <Td colSpan={4} style={{ textAlign: 'center' }}>
                    No interviews yet. Create one to get started!
                  </Td>
                </tr>
              ) : (
                interviews.map((interview) => (
                  <tr key={interview.id} onClick={() => handleRowClick(interview)}>
                    <Td><strong>{interview.candidateName}</strong></Td>
                    <Td>{new Date(interview.date).toLocaleDateString()}</Td>
                    <Td><StatusBadge status={interview.status}>{interview.status}</StatusBadge></Td>
                    <Td>{interview.sectionConfigs.length} sections</Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Container>
      );
    };
    ```

## Todo List

- [ ] Create results types (server)
- [ ] Implement results service with weighted scoring
- [ ] Configure section weights (default values)
- [ ] Create results controller
- [ ] Create results routes
- [ ] Register results routes in main server
- [ ] Create results types (client)
- [ ] Create results API client service
- [ ] Create ScoreGauge component with color coding
- [ ] Create SectionScoreCard component
- [ ] Create InterviewResultsPage
- [ ] Create InterviewListPage
- [ ] Test weighted score calculation
- [ ] Test color coding (red/yellow/green)
- [ ] Test interview list filtering by status
- [ ] Verify clicking interview navigates to correct page
- [ ] Test empty state when no interviews

## Success Criteria

- Results page displays overall weighted score correctly
- Section scores calculated as average of question scores
- Weighted formula applies section weights correctly
- Color coding matches thresholds (<3 red, 3-3.9 yellow, ≥4 green)
- Question scores and notes displayed in table
- Interview list shows all user's interviews
- Clicking completed interview shows results page
- Clicking in-progress interview resumes live mode
- Clicking setup interview shows setup page
- Empty state displays when no interviews exist

## Risk Assessment

**Risk:** Weighted calculation incorrect
**Mitigation:** Unit tests for score calculation logic, manual verification

**Risk:** Performance issues with large number of questions
**Mitigation:** Database indexes, pagination if needed

## Security Considerations

- Only interviewer can view their interview results
- Results endpoint validates ownership
- No editing allowed on completed interviews

## Next Steps

Proceed to **Phase 09: Export Reports** to implement PDF and Excel generation with @react-pdf/renderer and exceljs libraries.
