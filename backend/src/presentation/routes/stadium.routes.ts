import { Router } from 'express';
import { stadiumControllerInstance } from '../controllers/stadium.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { updateGateStatusSchema, updateGateTelemetrySchema } from '../../shared/zod-schemas';

const router = Router();

router.get('/gates', authenticate, (req, res, next) => stadiumControllerInstance.getGates(req, res, next));

router.patch(
  '/gates/:id',
  authenticate,
  authorize(['OpsManager']),
  validateBody(updateGateStatusSchema),
  (req, res, next) => stadiumControllerInstance.updateGateStatus(req, res, next)
);

router.put(
  '/gates/:id/telemetry',
  authenticate,
  authorize(['OpsManager']),
  validateBody(updateGateTelemetrySchema),
  (req, res, next) => stadiumControllerInstance.updateGateTelemetry(req, res, next)
);

router.get('/telemetry', authenticate, (req, res, next) => stadiumControllerInstance.getTelemetry(req, res, next));
router.get('/telemetry/history', authenticate, (req, res, next) => stadiumControllerInstance.getTelemetryHistory(req, res, next));
router.get('/health', authenticate, (req, res, next) => stadiumControllerInstance.getSystemHealth(req, res, next));

export default router;
