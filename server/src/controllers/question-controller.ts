import { Request, Response } from 'express';
import { QuestionService } from '../services/question-service';
import { Difficulty } from '../../prisma/generated/prisma/client';

export class QuestionController {
  static async list(req: Request, res: Response) {
    try {
      const { sectionId, difficulty, tags, page, limit } = req.query;

      const filters = {
        sectionId: sectionId as string,
        difficulty: difficulty as Difficulty,
        tags: tags ? (tags as string).split(',') : undefined,
        page: page ? parseInt(page as string) || 1 : 1,
        limit: limit ? parseInt(limit as string) || 50 : 50,
      };

      const result = await QuestionService.listQuestions(filters);
      res.json(result);
    } catch (error) {
      console.error('List questions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const question = await QuestionService.getQuestionById(id);

      if (!question) {
        res.status(404).json({ error: 'Question not found' });
        return;
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
        res.status(400).json({ error: 'sectionId, text, answer, and difficulty required' });
        return;
      }

      if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
        res.status(400).json({ error: 'difficulty must be EASY, MEDIUM, or HARD' });
        return;
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
      const id = req.params.id as string;
      const { text, answer, difficulty, tags } = req.body;

      if (difficulty && !['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
        res.status(400).json({ error: 'difficulty must be EASY, MEDIUM, or HARD' });
        return;
      }

      const question = await QuestionService.updateQuestion(
        id,
        { text, answer, difficulty, tags },
        req.userId!
      );

      res.json(question);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg === 'Question not found') {
        res.status(404).json({ error: 'Question not found' });
        return;
      }
      if (msg === 'Unauthorized') {
        res.status(403).json({ error: 'You can only edit questions you created' });
        return;
      }
      console.error('Update question error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await QuestionService.deleteQuestion(id);
      res.status(204).send();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg === 'Question not found') {
        res.status(404).json({ error: 'Question not found' });
        return;
      }
      console.error('Delete question error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
