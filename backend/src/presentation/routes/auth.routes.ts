import { Router } from 'express';
import { authControllerInstance } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../../shared/zod-schemas';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', validateBody(registerSchema), authControllerInstance.register);
router.post('/login', validateBody(loginSchema), authControllerInstance.login);
router.get('/profile', authenticate, authControllerInstance.getProfile);

export default router;
