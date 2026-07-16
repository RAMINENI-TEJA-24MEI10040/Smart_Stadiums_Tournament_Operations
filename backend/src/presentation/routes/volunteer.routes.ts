import { Router } from 'express';
import { volunteerControllerInstance } from '../controllers/volunteer.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { checkInVolunteerSchema, volunteerReallocationSchema, registerVolunteerSchema } from '../../shared/zod-schemas';

const router = Router();

router.get('/', authenticate, (req, res, next) => volunteerControllerInstance.getVolunteers(req, res, next));

router.post(
  '/register',
  authenticate,
  validateBody(registerVolunteerSchema),
  (req, res, next) => volunteerControllerInstance.register(req, res, next)
);

router.patch(
  '/:id/check-in',
  authenticate,
  validateBody(checkInVolunteerSchema),
  (req, res, next) => volunteerControllerInstance.checkIn(req, res, next)
);

router.patch(
  '/:id/check-out',
  authenticate,
  (req, res, next) => volunteerControllerInstance.checkOut(req, res, next)
);

router.patch(
  '/:id/reallocate',
  authenticate,
  authorize(['OpsManager']),
  validateBody(volunteerReallocationSchema),
  (req, res, next) => volunteerControllerInstance.reallocate(req, res, next)
);

export default router;
