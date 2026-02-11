import { Request, Response } from 'express';
import prisma from '../utils/prisma-client';

export class SectionController {
  static async list(_req: Request, res: Response) {
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
