import { Request, Response } from 'express';
import { ScoreService } from '../services/score-service';
import prisma from '../utils/prisma-client';

export class ScoreController {
  static async upsert(req: Request, res: Response) {
    try {
      const { interviewId, questionId, score, notes } = req.body;

      if (!interviewId || !questionId || score === undefined) {
        res.status(400).json({ error: 'interviewId, questionId, and score required' });
        return;
      }

      if (!Number.isInteger(score) || score < 1 || score > 5) {
        res.status(400).json({ error: 'score must be an integer between 1 and 5' });
        return;
      }

      // Verify interview ownership
      const interview = await prisma.interviewSession.findUnique({ where: { id: interviewId } });
      if (!interview) { res.status(404).json({ error: 'Interview not found' }); return; }
      if (interview.interviewerId !== req.userId) { res.status(403).json({ error: 'Unauthorized' }); return; }

      const result = await ScoreService.upsertScore({ interviewId, questionId, score, notes });
      res.json(result);
    } catch (error) {
      console.error('Upsert score error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async listByInterview(req: Request, res: Response) {
    try {
      const interviewId = req.params.interviewId as string;

      // Verify interview ownership
      const interview = await prisma.interviewSession.findUnique({ where: { id: interviewId } });
      if (!interview) { res.status(404).json({ error: 'Interview not found' }); return; }
      if (interview.interviewerId !== req.userId) { res.status(403).json({ error: 'Unauthorized' }); return; }

      const scores = await ScoreService.getScoresForInterview(interviewId);
      res.json(scores);
    } catch (error) {
      console.error('List scores error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
