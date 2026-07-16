import { Router } from 'express';
import { aiControllerInstance } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { aiQuerySchema } from '../../shared/zod-schemas';

const router = Router();

router.post(
  '/query',
  authenticate,
  validateBody(aiQuerySchema),
  (req, res, next) => aiControllerInstance.query(req, res, next)
);

router.get(
  '/metrics',
  authenticate,
  (req, res, next) => aiControllerInstance.getMetrics(req, res, next)
);

export default router;
