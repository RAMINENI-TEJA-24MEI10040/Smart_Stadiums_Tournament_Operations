import { Router } from 'express';
import { volunteerControllerInstance } from '../controllers/volunteer.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { checkInVolunteerSchema, volunteerReallocationSchema } from '../../shared/zod-schemas';
import { z } from 'zod';

const router = Router();

router.get('/', authenticate, volunteerControllerInstance.getVolunteers);

router.post(
  '/register',
  validateBody(z.object({ name: z.string().min(1) })),
  volunteerControllerInstance.register
);

router.patch(
  '/:id/check-in',
  validateBody(checkInVolunteerSchema),
  volunteerControllerInstance.checkIn
);

router.patch('/:id/check-out', volunteerControllerInstance.checkOut);

router.patch(
  '/:id/reallocate',
  authenticate,
  authorize(['OpsManager']),
  validateBody(volunteerReallocationSchema),
  volunteerControllerInstance.reallocate
);

export default router;
