import { Router } from 'express';
import { aiControllerInstance } from '../controllers/ai.controller';
import { validateBody } from '../middleware/validation.middleware';
import { aiQuerySchema } from '../../shared/zod-schemas';

const router = Router();

router.post('/query', validateBody(aiQuerySchema), aiControllerInstance.query);
router.get('/metrics', aiControllerInstance.getMetrics);

export default router;
