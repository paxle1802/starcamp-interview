import { Router } from 'express';
import { ScoreController } from '../controllers/score-controller';
import { authMiddleware } from '../middleware/auth-middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', ScoreController.upsert);
router.get('/interview/:interviewId', ScoreController.listByInterview);

export default router;
