import { Request, Response, NextFunction } from 'express';
import { volunteerServiceInstance } from '../../application/services/volunteer.service';

export class VolunteerController {
  public async getVolunteers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await volunteerServiceInstance.getVolunteers();
      res.status(200).json({
        status: 'Success',
        data: list.map(v => v.toJSON())
      });
    } catch (err) {
      next(err);
    }
  }

  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vol = await volunteerServiceInstance.registerVolunteer(req.body.name);
      res.status(201).json({
        status: 'Success',
        message: 'Volunteer registered in roster',
        data: vol.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  public async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vol = await volunteerServiceInstance.checkIn(
        req.params.id,
        req.body.assignedSection,
        req.body.skills
      );
      res.status(200).json({
        status: 'Success',
        message: 'Volunteer check-in recorded successfully',
        data: vol.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  public async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vol = await volunteerServiceInstance.checkOut(req.params.id);
      res.status(200).json({
        status: 'Success',
        message: 'Volunteer checkout recorded successfully',
        data: vol.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  public async reallocate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vol = await volunteerServiceInstance.reallocateVolunteer(
        req.params.id,
        req.body.section,
        req.body.task
      );
      res.status(200).json({
        status: 'Success',
        message: 'Volunteer reallocated to section successfully',
        data: vol.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }
}

export const volunteerControllerInstance = new VolunteerController();
