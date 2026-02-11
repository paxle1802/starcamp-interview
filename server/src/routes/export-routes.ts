import { Router } from 'express';
import { ExportController } from '../controllers/export-controller';
import { authMiddleware } from '../middleware/auth-middleware';

const router = Router();

router.use(authMiddleware);

router.get('/:id/export/pdf', ExportController.exportPdf);
router.get('/:id/export/excel', ExportController.exportExcel);

export default router;
