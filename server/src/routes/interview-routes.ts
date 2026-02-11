import { Router } from 'express';
import { InterviewController } from '../controllers/interview-controller';
import { authMiddleware } from '../middleware/auth-middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', InterviewController.create);
router.get('/', InterviewController.list);
router.get('/:id', InterviewController.getById);
router.put('/:id', InterviewController.update);
router.post('/:id/start', InterviewController.start);
router.post('/:id/complete', InterviewController.complete);
router.delete('/:id', InterviewController.remove);

export default router;
