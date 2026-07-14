import { Router } from 'express';
import { stadiumControllerInstance } from '../controllers/stadium.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { updateGateStatusSchema, updateGateTelemetrySchema } from '../../shared/zod-schemas';

const router = Router();

router.get('/gates', stadiumControllerInstance.getGates);

router.patch(
  '/gates/:id',
  authenticate,
  authorize(['OpsManager']),
  validateBody(updateGateStatusSchema),
  stadiumControllerInstance.updateGateStatus
);

router.put(
  '/gates/:id/telemetry',
  validateBody(updateGateTelemetrySchema),
  stadiumControllerInstance.updateGateTelemetry
);

router.get('/telemetry', stadiumControllerInstance.getTelemetry);
router.get('/telemetry/history', stadiumControllerInstance.getTelemetryHistory);
router.get('/health', stadiumControllerInstance.getSystemHealth);

export default router;
