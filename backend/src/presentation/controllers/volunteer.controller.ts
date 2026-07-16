import { Request, Response, NextFunction } from 'express';
import { getVolunteerService } from '../../application/services/volunteer.service';

/**
 * Controller handling volunteer registration, check-ins, check-outs, and section reallocations.
 * Strictly validates inputs, authorizes roles, and delegates business rules to VolunteerService.
 */
export class VolunteerController {
  /**
   * Retrieves all registered volunteers.
   */
  public async getVolunteers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const volunteerService = getVolunteerService();
      const list = await volunteerService.getVolunteers();
      res.status(200).json({
        status: 'Success',
        data: list.map(v => v.toJSON())
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Registers a new volunteer roster profile.
   */
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.body;
      const volunteerService = getVolunteerService();
      const vol = await volunteerService.registerVolunteer(name);
      
      res.status(201).json({
        status: 'Success',
        message: 'Volunteer registered in roster',
        data: vol.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Commences a volunteer's shift, mapping skills and assigning a location sector.
   */
  public async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assignedSection, skills } = req.body;
      const volunteerService = getVolunteerService();
      const vol = await volunteerService.checkIn(
        req.params.id,
        assignedSection,
        skills
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

  /**
   * Concludes a volunteer's shift.
   */
  public async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const volunteerService = getVolunteerService();
      const vol = await volunteerService.checkOut(req.params.id);
      
      res.status(200).json({
        status: 'Success',
        message: 'Volunteer checkout recorded successfully',
        data: vol.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reallocates a volunteer to a new stadium section and assigns an active task.
   */
  public async reallocate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { section, task } = req.body;
      const volunteerService = getVolunteerService();
      const vol = await volunteerService.reallocateVolunteer(
        req.params.id,
        section,
        task
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
