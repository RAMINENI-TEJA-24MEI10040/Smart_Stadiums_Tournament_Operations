import { Router } from 'express';
import { matchControllerInstance } from '../controllers/match.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createMatchSchema, updateMatchStatusSchema } from '../../shared/zod-schemas';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(['OpsManager', 'Director']),
  validateBody(createMatchSchema),
  (req, res, next) => matchControllerInstance.schedule(req, res, next)
);

router.get('/', authenticate, (req, res, next) => matchControllerInstance.getMatches(req, res, next));

router.patch(
  '/:id/status',
  authenticate,
  authorize(['OpsManager', 'Director']),
  validateBody(updateMatchStatusSchema),
  (req, res, next) => matchControllerInstance.updateStatus(req, res, next)
);

export default router;
