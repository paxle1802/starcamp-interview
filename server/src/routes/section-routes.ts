import { Router } from 'express';
import { SectionController } from '../controllers/section-controller';
import { authMiddleware } from '../middleware/auth-middleware';

const router = Router();

router.use(authMiddleware);
router.get('/', SectionController.list);

export default router;
