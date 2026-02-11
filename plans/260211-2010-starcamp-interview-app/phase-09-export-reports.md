# Phase 09: Export Reports

## Overview

**Priority:** P1 (Critical)
**Status:** Pending
**Effort:** 4h

Implement PDF scorecard generation (@react-pdf/renderer) and Excel export (exceljs) with formatted scores, conditional formatting, and download functionality.

## Key Insights

- @react-pdf/renderer for structured PDF scorecards (lighter than Puppeteer)
- exceljs for rich Excel formatting (conditional formatting, styling)
- Server-side generation (API routes return file streams)
- PDF: Professional scorecard layout with branding
- Excel: Detailed data with formulas, charts optional for MVP

## Requirements

### Functional
- GET /api/export/pdf/:interviewId - Generate PDF scorecard
- GET /api/export/excel/:interviewId - Generate Excel report
- PDF contains:
  - Header (candidate name, date, overall score)
  - Section-by-section breakdown
  - Per-question scores and notes
  - Footer (interviewer name, timestamp)
- Excel contains:
  - Summary sheet (overall score, section scores)
  - Detailed sheet (all questions, scores, notes)
  - Conditional formatting (color-coded scores)

### Non-Functional
- PDF file size <1MB for typical interview
- Excel includes formulas for score calculations
- File names: `interview_[candidate]_[date].pdf/xlsx`
- Download triggers automatically on button click
- Loading indicator during generation

## Architecture

```
Client                          Server
  │                               │
  ├─ Click "Export PDF" ─────────>│ Generate PDF with @react-pdf/renderer
  │                               │ Return blob stream
  │<─── PDF blob ─────────────────┤
  │                               │
  └─ Trigger download             │
```

### PDF Layout
```
┌─────────────────────────────────────┐
│  Interview Scorecard                │
│  Candidate: [Name]                  │
│  Date: [Date]    Score: [X.X/5.0]   │
├─────────────────────────────────────┤
│  Section 1: Introduction            │
│  Avg: [X.X/5.0]    Weight: [0.5]    │
│  ┌────────────────────────────────┐ │
│  │ Q1: [text]        Score: [X/5] │ │
│  │ Notes: [notes]                 │ │
│  └────────────────────────────────┘ │
├─────────────────────────────────────┤
│  [Repeat for all sections]          │
├─────────────────────────────────────┤
│  Interviewer: [Name]                │
│  Generated: [Timestamp]             │
└─────────────────────────────────────┘
```

## Related Code Files

### Files to Create
- `/server/src/controllers/export-controller.ts` - Export endpoints
- `/server/src/services/pdf-export-service.ts` - PDF generation logic
- `/server/src/services/excel-export-service.ts` - Excel generation logic
- `/server/src/routes/export-routes.ts` - Export routes
- `/server/src/utils/pdf-templates.tsx` - PDF layout components
- `/client/src/utils/file-download.ts` - Client-side download helper

### Files to Modify
- `/server/package.json` - Add @react-pdf/renderer, exceljs
- `/server/src/index.ts` - Register export routes
- `/client/src/pages/interview-results-page.tsx` - Wire export buttons

## Implementation Steps

1. **Install dependencies (server)**
   ```bash
   cd server
   npm install @react-pdf/renderer exceljs
   npm install -D @types/react
   ```

2. **Create PDF template components (server)**

   Create `server/src/utils/pdf-templates.tsx`:
   ```tsx
   import React from 'react';
   import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
   import { InterviewResults } from '../types/results-types';

   const styles = StyleSheet.create({
     page: { padding: 30 },
     header: { marginBottom: 20, borderBottom: '2px solid #333' },
     title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
     subtitle: { fontSize: 12, color: '#666', marginBottom: 5 },
     overallScore: { fontSize: 18, fontWeight: 'bold', color: '#28a745' },
     section: { marginTop: 20, marginBottom: 20 },
     sectionHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
     sectionMeta: { fontSize: 12, color: '#666', marginBottom: 10 },
     question: { marginBottom: 15, padding: 10, backgroundColor: '#f8f9fa' },
     questionText: { fontSize: 11, marginBottom: 5 },
     questionScore: { fontSize: 12, fontWeight: 'bold', color: '#007bff' },
     notes: { fontSize: 10, color: '#666', marginTop: 5 },
     footer: { marginTop: 30, paddingTop: 10, borderTop: '1px solid #e0e0e0', fontSize: 10, color: '#666' },
   });

   export const InterviewScorecard = ({ results }: { results: InterviewResults }) => (
     <Document>
       <Page size="A4" style={styles.page}>
         <View style={styles.header}>
           <Text style={styles.title}>Interview Scorecard</Text>
           <Text style={styles.subtitle}>Candidate: {results.candidateName}</Text>
           <Text style={styles.subtitle}>Date: {new Date(results.date).toLocaleDateString()}</Text>
           <Text style={styles.overallScore}>Overall Score: {results.overallScore.toFixed(1)}/5.0</Text>
         </View>

         {results.sectionResults.map((section, idx) => (
           <View key={idx} style={styles.section}>
             <Text style={styles.sectionHeader}>{section.sectionName}</Text>
             <Text style={styles.sectionMeta}>
               Average: {section.averageScore.toFixed(1)}/5.0 | Weight: {section.weight}
             </Text>

             {section.questionScores.map((qs, qIdx) => (
               <View key={qIdx} style={styles.question}>
                 <Text style={styles.questionText}>
                   Q{qIdx + 1}: {qs.questionText.substring(0, 150)}...
                 </Text>
                 <Text style={styles.questionScore}>Score: {qs.score}/5</Text>
                 {qs.notes && <Text style={styles.notes}>Notes: {qs.notes}</Text>}
               </View>
             ))}
           </View>
         ))}

         <View style={styles.footer}>
           <Text>Generated: {new Date().toLocaleString()}</Text>
         </View>
       </Page>
     </Document>
   );
   ```

3. **Create PDF export service (server)**

   Create `server/src/services/pdf-export-service.ts`:
   ```typescript
   import ReactPDF from '@react-pdf/renderer';
   import { ResultsService } from './results-service';
   import { InterviewScorecard } from '../utils/pdf-templates';

   export class PDFExportService {
     static async generatePDF(interviewId: string, userId: string): Promise<Buffer> {
       const results = await ResultsService.calculateResults(interviewId, userId);

       const doc = <InterviewScorecard results={results} />;
       const pdfBuffer = await ReactPDF.renderToBuffer(doc);

       return pdfBuffer;
     }
   }
   ```

4. **Create Excel export service (server)**

   Create `server/src/services/excel-export-service.ts`:
   ```typescript
   import ExcelJS from 'exceljs';
   import { ResultsService } from './results-service';

   export class ExcelExportService {
     static async generateExcel(interviewId: string, userId: string): Promise<Buffer> {
       const results = await ResultsService.calculateResults(interviewId, userId);

       const workbook = new ExcelJS.Workbook();

       // Summary sheet
       const summarySheet = workbook.addWorksheet('Summary');
       summarySheet.columns = [
         { header: 'Field', key: 'field', width: 30 },
         { header: 'Value', key: 'value', width: 20 },
       ];

       summarySheet.addRows([
         { field: 'Candidate Name', value: results.candidateName },
         { field: 'Interview Date', value: new Date(results.date).toLocaleDateString() },
         { field: 'Overall Score', value: results.overallScore.toFixed(2) },
         { field: 'Total Questions', value: results.totalQuestions },
         { field: 'Answered Questions', value: results.answeredQuestions },
       ]);

       summarySheet.getRow(1).font = { bold: true };

       // Section scores sheet
       const sectionSheet = workbook.addWorksheet('Section Scores');
       sectionSheet.columns = [
         { header: 'Section', key: 'section', width: 30 },
         { header: 'Average Score', key: 'avgScore', width: 15 },
         { header: 'Weight', key: 'weight', width: 10 },
       ];

       results.sectionResults.forEach((section) => {
         sectionSheet.addRow({
           section: section.sectionName,
           avgScore: section.averageScore.toFixed(2),
           weight: section.weight,
         });
       });

       sectionSheet.getRow(1).font = { bold: true };

       // Detailed scores sheet
       const detailSheet = workbook.addWorksheet('Question Details');
       detailSheet.columns = [
         { header: 'Section', key: 'section', width: 25 },
         { header: 'Question', key: 'question', width: 50 },
         { header: 'Score', key: 'score', width: 10 },
         { header: 'Notes', key: 'notes', width: 40 },
       ];

       results.sectionResults.forEach((section) => {
         section.questionScores.forEach((qs) => {
           detailSheet.addRow({
             section: section.sectionName,
             question: qs.questionText,
             score: qs.score,
             notes: qs.notes || '',
           });
         });
       });

       detailSheet.getRow(1).font = { bold: true };

       // Conditional formatting for scores
       detailSheet.addConditionalFormatting({
         ref: `C2:C${detailSheet.rowCount}`,
         rules: [
           {
             type: 'cellIs',
             operator: 'lessThan',
             formulae: [3],
             style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF8D7DA' } } },
           },
           {
             type: 'cellIs',
             operator: 'between',
             formulae: [3, 3.9],
             style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFF3CD' } } },
           },
           {
             type: 'cellIs',
             operator: 'greaterThanOrEqual',
             formulae: [4],
             style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFD4EDDA' } } },
           },
         ],
       });

       const buffer = await workbook.xlsx.writeBuffer();
       return buffer as Buffer;
     }
   }
   ```

5. **Create export controller (server)**

   Create `server/src/controllers/export-controller.ts`:
   ```typescript
   import { Request, Response } from 'express';
   import { PDFExportService } from '../services/pdf-export-service';
   import { ExcelExportService } from '../services/excel-export-service';

   export class ExportController {
     static async exportPDF(req: Request, res: Response) {
       try {
         const { interviewId } = req.params;
         const pdfBuffer = await PDFExportService.generatePDF(interviewId, req.userId!);

         res.setHeader('Content-Type', 'application/pdf');
         res.setHeader('Content-Disposition', `attachment; filename=interview_${interviewId}.pdf`);
         res.send(pdfBuffer);
       } catch (error: any) {
         if (error.message === 'Interview not found') {
           return res.status(404).json({ error: 'Interview not found' });
         }
         if (error.message === 'Unauthorized') {
           return res.status(403).json({ error: 'Unauthorized' });
         }
         console.error('Export PDF error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }

     static async exportExcel(req: Request, res: Response) {
       try {
         const { interviewId } = req.params;
         const excelBuffer = await ExcelExportService.generateExcel(interviewId, req.userId!);

         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
         res.setHeader('Content-Disposition', `attachment; filename=interview_${interviewId}.xlsx`);
         res.send(excelBuffer);
       } catch (error: any) {
         if (error.message === 'Interview not found') {
           return res.status(404).json({ error: 'Interview not found' });
         }
         if (error.message === 'Unauthorized') {
           return res.status(403).json({ error: 'Unauthorized' });
         }
         console.error('Export Excel error:', error);
         res.status(500).json({ error: 'Internal server error' });
       }
     }
   }
   ```

6. **Create export routes (server)**

   Create `server/src/routes/export-routes.ts`:
   ```typescript
   import { Router } from 'express';
   import { ExportController } from '../controllers/export-controller';
   import { authMiddleware } from '../middleware/auth-middleware';

   const router = Router();

   router.use(authMiddleware);

   router.get('/pdf/:interviewId', ExportController.exportPDF);
   router.get('/excel/:interviewId', ExportController.exportExcel);

   export default router;
   ```

   Register in `server/src/index.ts`:
   ```typescript
   import exportRoutes from './routes/export-routes';
   app.use('/api/export', exportRoutes);
   ```

7. **Create file download utility (client)**

   Create `client/src/utils/file-download.ts`:
   ```typescript
   export const downloadFile = async (url: string, filename: string) => {
     try {
       const response = await fetch(url, {
         credentials: 'include', // Send cookies
       });

       if (!response.ok) throw new Error('Download failed');

       const blob = await response.blob();
       const downloadUrl = window.URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = downloadUrl;
       link.download = filename;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       window.URL.revokeObjectURL(downloadUrl);
     } catch (error) {
       console.error('Download error:', error);
       alert('Failed to download file');
     }
   };
   ```

8. **Wire export buttons (client)**

   Modify `client/src/pages/interview-results-page.tsx`:
   ```tsx
   import { downloadFile } from '../utils/file-download';

   // Inside component:
   const handleExportPDF = async () => {
     if (!id) return;
     await downloadFile(
       `http://localhost:3001/api/export/pdf/${id}`,
       `interview_${results?.candidateName}_${new Date().toISOString().split('T')[0]}.pdf`
     );
   };

   const handleExportExcel = async () => {
     if (!id) return;
     await downloadFile(
       `http://localhost:3001/api/export/excel/${id}`,
       `interview_${results?.candidateName}_${new Date().toISOString().split('T')[0]}.xlsx`
     );
   };

   // In JSX:
   <ExportButtons>
     <button onClick={handleExportPDF}>Export PDF</button>
     <button onClick={handleExportExcel}>Export Excel</button>
   </ExportButtons>
   ```

## Todo List

- [ ] Install @react-pdf/renderer and exceljs
- [ ] Create PDF template components
- [ ] Implement PDF export service
- [ ] Implement Excel export service with 3 sheets
- [ ] Add conditional formatting to Excel scores
- [ ] Create export controller
- [ ] Create export routes
- [ ] Register export routes in main server
- [ ] Create file download utility (client)
- [ ] Wire export buttons in results page
- [ ] Test PDF generation and download
- [ ] Test Excel generation and download
- [ ] Verify PDF layout and formatting
- [ ] Verify Excel conditional formatting works
- [ ] Test file naming convention
- [ ] Test error handling for non-existent interviews

## Success Criteria

- PDF downloads with correct filename format
- PDF contains all interview data (header, sections, questions, scores, notes)
- PDF formatted professionally with clear layout
- Excel contains 3 sheets (Summary, Section Scores, Question Details)
- Excel conditional formatting colors scores correctly
- Excel formulas calculate averages (if implemented)
- Download triggers automatically on button click
- Loading state shows during generation
- Error message displays if export fails
- File sizes reasonable (<1MB for PDF, <500KB for Excel)

## Risk Assessment

**Risk:** @react-pdf/renderer fails with complex layouts
**Mitigation:** Keep layout simple, test incrementally

**Risk:** Large interviews cause memory issues
**Mitigation:** Stream responses, limit question preview length

**Risk:** Excel formulas break with missing data
**Mitigation:** Handle null scores gracefully, use conditional logic

## Security Considerations

- Validate user owns interview before exporting
- Auth middleware protects export endpoints
- No sensitive data in file names (use IDs, not names)
- Content-Disposition header forces download (prevents XSS)

## Next Steps

Proceed to **Phase 10: Testing** to write unit tests, integration tests, and E2E test scenarios for all features.
