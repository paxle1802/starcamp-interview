import { Request, Response } from 'express';
import { InterviewService } from '../services/interview-service';

export class InterviewController {
  static async create(req: Request, res: Response) {
    try {
      const { candidateName, sectionConfigs, selectedQuestions } = req.body;

      if (!candidateName || !sectionConfigs || !selectedQuestions) {
        res.status(400).json({ error: 'candidateName, sectionConfigs, and selectedQuestions required' });
        return;
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
      const id = req.params.id as string;
      const { candidateName, sectionConfigs, selectedQuestions } = req.body;

      const interview = await InterviewService.updateInterview(
        id,
        { candidateName, sectionConfigs, selectedQuestions },
        req.userId!
      );

      res.json(interview);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg === 'Interview not found') { res.status(404).json({ error: msg }); return; }
      if (msg === 'Unauthorized') { res.status(403).json({ error: msg }); return; }
      if (msg.includes('SETUP')) { res.status(400).json({ error: msg }); return; }
      console.error('Update interview error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const interview = await InterviewService.getInterview(id, req.userId!);
      res.json(interview);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg === 'Interview not found') { res.status(404).json({ error: msg }); return; }
      if (msg === 'Unauthorized') { res.status(403).json({ error: msg }); return; }
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

  static async start(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const interview = await InterviewService.startInterview(id, req.userId!);
      res.json(interview);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg === 'Interview not found') { res.status(404).json({ error: msg }); return; }
      if (msg === 'Unauthorized') { res.status(403).json({ error: msg }); return; }
      if (msg.includes('SETUP')) { res.status(400).json({ error: msg }); return; }
      console.error('Start interview error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async complete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const interview = await InterviewService.completeInterview(id, req.userId!);
      res.json(interview);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg === 'Interview not found') { res.status(404).json({ error: msg }); return; }
      if (msg === 'Unauthorized') { res.status(403).json({ error: msg }); return; }
      console.error('Complete interview error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await InterviewService.deleteInterview(id, req.userId!);
      res.status(204).send();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg === 'Interview not found') { res.status(404).json({ error: msg }); return; }
      if (msg === 'Unauthorized') { res.status(403).json({ error: msg }); return; }
      console.error('Delete interview error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
