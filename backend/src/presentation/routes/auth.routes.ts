import { Router } from 'express';
import { authControllerInstance } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../../shared/zod-schemas';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post(
  '/register',
  validateBody(registerSchema),
  (req, res, next) => authControllerInstance.register(req, res, next)
);

router.post(
  '/login',
  validateBody(loginSchema),
  (req, res, next) => authControllerInstance.login(req, res, next)
);

router.get(
  '/profile',
  authenticate,
  (req, res, next) => authControllerInstance.getProfile(req, res, next)
);

export default router;
