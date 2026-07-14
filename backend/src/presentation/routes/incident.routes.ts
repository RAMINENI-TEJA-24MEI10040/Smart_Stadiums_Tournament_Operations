import { Router } from 'express';
import { incidentControllerInstance } from '../controllers/incident.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { fileIncidentSchema, updateIncidentStatusSchema, assignIncidentStaffSchema } from '../../shared/zod-schemas';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(['OpsManager', 'Security']),
  validateBody(fileIncidentSchema),
  incidentControllerInstance.file
);

router.get('/', authenticate, incidentControllerInstance.getIncidents);

router.patch(
  '/:id/status',
  authenticate,
  authorize(['OpsManager', 'Security']),
  validateBody(updateIncidentStatusSchema),
  incidentControllerInstance.updateStatus
);

router.patch(
  '/:id/assign',
  authenticate,
  authorize(['OpsManager', 'Security']),
  validateBody(assignIncidentStaffSchema),
  incidentControllerInstance.assignStaff
);

router.post('/:id/summary', authenticate, incidentControllerInstance.generateSummary);

export default router;
