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
  (req, res, next) => incidentControllerInstance.file(req, res, next)
);

router.get('/', authenticate, (req, res, next) => incidentControllerInstance.getIncidents(req, res, next));

router.patch(
  '/:id/status',
  authenticate,
  authorize(['OpsManager', 'Security']),
  validateBody(updateIncidentStatusSchema),
  (req, res, next) => incidentControllerInstance.updateStatus(req, res, next)
);

router.patch(
  '/:id/assign',
  authenticate,
  authorize(['OpsManager', 'Security']),
  validateBody(assignIncidentStaffSchema),
  (req, res, next) => incidentControllerInstance.assignStaff(req, res, next)
);

router.post(
  '/:id/summary',
  authenticate,
  authorize(['OpsManager', 'Security']),
  (req, res, next) => incidentControllerInstance.generateSummary(req, res, next)
);

export default router;
