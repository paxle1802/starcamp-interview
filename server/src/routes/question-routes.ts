import { Router } from 'express';
import { QuestionController } from '../controllers/question-controller';
import { authMiddleware } from '../middleware/auth-middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', QuestionController.list);
router.get('/:id', QuestionController.getById);
router.post('/', QuestionController.create);
router.put('/:id', QuestionController.update);
router.delete('/:id', QuestionController.remove);

export default router;
