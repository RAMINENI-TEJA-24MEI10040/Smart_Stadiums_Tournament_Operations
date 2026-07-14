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
  matchControllerInstance.schedule
);

router.get('/', matchControllerInstance.getMatches);

router.patch(
  '/:id/status',
  authenticate,
  authorize(['OpsManager', 'Director']),
  validateBody(updateMatchStatusSchema),
  matchControllerInstance.updateStatus
);

export default router;
