import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  role: z.enum(['OpsManager', 'Director', 'Security', 'Volunteer']),
  name: z.string().min(1),
  email: z.string().email()
});

export const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

export const createMatchSchema = z.object({
  homeTeam: z.string().min(1),
  awayTeam: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  venue: z.string().min(1),
  referee: z.string().min(1)
});

export const updateMatchStatusSchema = z.object({
  status: z.enum(['Scheduled', 'Live', 'Completed', 'Delayed']),
  safetyMessage: z.string().optional()
});

export const updateGateStatusSchema = z.object({
  status: z.enum(['Open', 'Closed', 'Congested', 'Maintenance'])
});

export const updateGateTelemetrySchema = z.object({
  turnstileFlowRate: z.number().min(0),
  currentOccupancy: z.number().min(0),
  capacityLimit: z.number().min(10)
});

export const fileIncidentSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(5),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  location: z.string().min(1)
});

export const updateIncidentStatusSchema = z.object({
  status: z.enum(['Reported', 'Dispatched', 'Resolving', 'Resolved']),
  comment: z.string().min(1)
});

export const assignIncidentStaffSchema = z.object({
  assignedStaff: z.string().min(1)
});

export const checkInVolunteerSchema = z.object({
  assignedSection: z.string().min(1),
  skills: z.array(z.string())
});

export const volunteerReallocationSchema = z.object({
  section: z.string().min(1),
  task: z.string().min(1)
});

export const aiQuerySchema = z.object({
  query: z.string().min(2),
  sessionId: z.string().optional()
});

export const registerVolunteerSchema = z.object({
  name: z.string().min(1)
});
