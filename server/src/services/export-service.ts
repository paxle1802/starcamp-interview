import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import prisma from '../utils/prisma-client';

const SCORE_LABELS: Record<number, string> = {
  1: 'Poor', 2: 'Need Improvement', 3: 'Average', 4: 'Good', 5: 'Excellent',
};

export class ExportService {
  static async getInterviewData(interviewId: string) {
    const interview = await prisma.interviewSession.findUnique({
      where: { id: interviewId },
      include: {
        interviewer: { select: { name: true, email: true } },
        sectionConfigs: {
          include: { section: true },
          orderBy: { order: 'asc' },
        },
        selectedQuestions: {
          include: { question: { include: { section: true } } },
          orderBy: { order: 'asc' },
        },
        scores: true,
      },
    });

    if (!interview) throw new Error('Interview not found');
    return interview;
  }

  static async generateExcel(interviewId: string): Promise<Buffer> {
    const interview = await this.getInterviewData(interviewId);
    const scoreMap = new Map(interview.scores.map(s => [s.questionId, s]));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Starcamp Interview';
    workbook.created = new Date();

    // Summary sheet
    const summary = workbook.addWorksheet('Summary');
    summary.columns = [
      { header: 'Field', key: 'field', width: 25 },
      { header: 'Value', key: 'value', width: 40 },
    ];
    summary.addRow({ field: 'Candidate', value: interview.candidateName });
    summary.addRow({ field: 'Interviewer', value: interview.interviewer.name });
    summary.addRow({ field: 'Date', value: new Date(interview.date).toLocaleDateString() });
    summary.addRow({ field: 'Status', value: interview.status });

    // Overall = average of section averages
    const sectionAvgs: number[] = [];
    for (const sc of interview.sectionConfigs) {
      const sectionQs = interview.selectedQuestions.filter(
        q => q.question.section.name === sc.section.name
      );
      const sScores = sectionQs
        .map(q => scoreMap.get(q.questionId))
        .filter((s): s is NonNullable<typeof s> => !!s);
      if (sScores.length > 0) {
        sectionAvgs.push(sScores.reduce((sum, s) => sum + s.score, 0) / sScores.length);
      }
    }
    const avgScore = sectionAvgs.length > 0
      ? (sectionAvgs.reduce((a, b) => a + b, 0) / sectionAvgs.length).toFixed(1) : 'N/A';
    summary.addRow({ field: 'Overall Average', value: avgScore });
    summary.addRow({ field: 'Questions Scored', value: `${interview.scores.length}` });

    // Detailed scores sheet
    const details = workbook.addWorksheet('Detailed Scores');
    details.columns = [
      { header: 'Section', key: 'section', width: 25 },
      { header: 'Question', key: 'question', width: 50 },
      { header: 'Difficulty', key: 'difficulty', width: 12 },
      { header: 'Score', key: 'score', width: 8 },
      { header: 'Rating', key: 'rating', width: 18 },
      { header: 'Notes', key: 'notes', width: 40 },
    ];

    for (const iq of interview.selectedQuestions) {
      const score = scoreMap.get(iq.questionId);
      details.addRow({
        section: iq.question.section.name,
        question: iq.question.text,
        difficulty: iq.question.difficulty,
        score: score?.score || '',
        rating: score ? SCORE_LABELS[score.score] : 'Not scored',
        notes: score?.notes || '',
      });
    }

    // Style headers
    [summary, details].forEach(sheet => {
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A1A2E' },
      };
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    // Section averages sheet
    const sectionSheet = workbook.addWorksheet('Section Averages');
    sectionSheet.columns = [
      { header: 'Section', key: 'section', width: 30 },
      { header: 'Duration (min)', key: 'duration', width: 15 },
      { header: 'Questions', key: 'count', width: 12 },
      { header: 'Average Score', key: 'avg', width: 15 },
    ];

    for (const sc of interview.sectionConfigs) {
      const sectionQuestions = interview.selectedQuestions.filter(
        q => q.question.section.name === sc.section.name
      );
      const sectionScores = sectionQuestions
        .map(q => scoreMap.get(q.questionId))
        .filter((s): s is NonNullable<typeof s> => !!s);
      const sectionAvg = sectionScores.length > 0
        ? (sectionScores.reduce((sum, s) => sum + s.score, 0) / sectionScores.length).toFixed(1)
        : 'N/A';

      sectionSheet.addRow({
        section: sc.section.name,
        duration: sc.durationMinutes,
        count: sectionQuestions.length,
        avg: sectionAvg,
      });
    }

    const headerRow3 = sectionSheet.getRow(1);
    headerRow3.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow3.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A1A2E' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  static async generatePdf(interviewId: string): Promise<Buffer> {
    const interview = await this.getInterviewData(interviewId);
    const scoreMap = new Map(interview.scores.map(s => [s.questionId, s]));

    // Overall = average of section averages
    const sectionAvgs: number[] = [];
    for (const sc of interview.sectionConfigs) {
      const sectionQs = interview.selectedQuestions.filter(
        q => q.question.section.name === sc.section.name
      );
      const sScores = sectionQs
        .map(q => scoreMap.get(q.questionId))
        .filter((s): s is NonNullable<typeof s> => !!s);
      if (sScores.length > 0) {
        sectionAvgs.push(sScores.reduce((sum, s) => sum + s.score, 0) / sScores.length);
      }
    }
    const avgScore = sectionAvgs.length > 0
      ? (sectionAvgs.reduce((a, b) => a + b, 0) / sectionAvgs.length).toFixed(1) : 'N/A';

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(22).font('Helvetica-Bold').text('Interview Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#666')
        .text('Starcamp Interview Platform', { align: 'center' });
      doc.moveDown(1.5);

      // Candidate info
      doc.fillColor('#000');
      doc.fontSize(11).font('Helvetica-Bold').text('Candidate: ', { continued: true });
      doc.font('Helvetica').text(interview.candidateName);

      doc.font('Helvetica-Bold').text('Interviewer: ', { continued: true });
      doc.font('Helvetica').text(interview.interviewer.name);

      doc.font('Helvetica-Bold').text('Date: ', { continued: true });
      doc.font('Helvetica').text(new Date(interview.date).toLocaleDateString());

      doc.font('Helvetica-Bold').text('Status: ', { continued: true });
      doc.font('Helvetica').text(interview.status);
      doc.moveDown(1);

      // Overall score
      doc.rect(50, doc.y, 495, 50).fill('#f5f5f7').stroke();
      const scoreY = doc.y + 15;
      doc.fillColor('#000').fontSize(13).font('Helvetica-Bold')
        .text(`Overall Average: ${avgScore} / 5`, 50, scoreY, { align: 'center', width: 495 });
      doc.fillColor('#666').fontSize(9).font('Helvetica')
        .text(`${interview.scores.length} questions scored`, 50, scoreY + 18, { align: 'center', width: 495 });
      doc.y = scoreY + 50;
      doc.moveDown(1);

      // Section-by-section breakdown
      for (const sc of interview.sectionConfigs) {
        const sectionQuestions = interview.selectedQuestions.filter(
          q => q.question.section.name === sc.section.name
        );
        const sectionScores = sectionQuestions
          .map(q => scoreMap.get(q.questionId))
          .filter((s): s is NonNullable<typeof s> => !!s);
        const sectionAvg = sectionScores.length > 0
          ? (sectionScores.reduce((sum, s) => sum + s.score, 0) / sectionScores.length).toFixed(1)
          : 'N/A';

        // Check if we need a new page
        if (doc.y > 680) doc.addPage();

        // Section header
        doc.fillColor('#0071e3').fontSize(14).font('Helvetica-Bold')
          .text(`${sc.section.name}  —  ${sectionAvg} / 5`);
        doc.fillColor('#666').fontSize(9).font('Helvetica')
          .text(`${sc.durationMinutes} min · ${sectionQuestions.length} questions`);
        doc.moveDown(0.5);

        // Questions in this section
        for (const iq of sectionQuestions) {
          const score = scoreMap.get(iq.questionId);

          if (doc.y > 700) doc.addPage();

          doc.fillColor('#000').fontSize(10).font('Helvetica')
            .text(iq.question.text, { indent: 10 });

          const scoreText = score
            ? `${score.score}/5 — ${SCORE_LABELS[score.score]}`
            : 'Not scored';
          const scoreColor = score
            ? (score.score >= 4 ? '#34c759' : score.score === 3 ? '#ff9500' : '#ff3b30')
            : '#999';

          doc.fillColor(scoreColor).fontSize(10).font('Helvetica-Bold')
            .text(scoreText, { indent: 10 });

          if (score?.notes) {
            doc.fillColor('#666').fontSize(9).font('Helvetica')
              .text(`Note: ${score.notes}`, { indent: 10 });
          }
          doc.moveDown(0.5);
        }

        doc.moveDown(0.5);
      }

      // Footer
      doc.fillColor('#999').fontSize(8).font('Helvetica')
        .text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 50, { align: 'center', width: 495 });

      doc.end();
    });
  }
}
