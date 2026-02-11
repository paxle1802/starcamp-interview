import { Request, Response } from 'express';
import { ExportService } from '../services/export-service';

export class ExportController {
  static async exportPdf(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const interview = await ExportService.getInterviewData(id);

      if (interview.interviewerId !== req.userId) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      const buffer = await ExportService.generatePdf(id);

      const filename = `starcamp-interview-${interview.candidateName.replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, '-')}-${
        new Date().toISOString().split('T')[0]
      }.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg === 'Interview not found') {
        res.status(404).json({ error: msg });
        return;
      }
      console.error('Export PDF error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async exportExcel(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const interview = await ExportService.getInterviewData(id);

      // Verify ownership
      if (interview.interviewerId !== req.userId) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      const buffer = await ExportService.generateExcel(id);

      const filename = `starcamp-interview-${interview.candidateName.replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, '-')}-${
        new Date().toISOString().split('T')[0]
      }.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg === 'Interview not found') {
        res.status(404).json({ error: msg });
        return;
      }
      console.error('Export Excel error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
