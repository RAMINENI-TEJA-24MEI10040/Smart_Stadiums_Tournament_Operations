import { Request, Response, NextFunction } from 'express';
import { authServiceInstance } from '../../application/services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authServiceInstance.register({
        username: req.body.username,
        passwordPlain: req.body.password,
        role: req.body.role,
        name: req.body.name,
        email: req.body.email
      });
      res.status(201).json({
        status: 'Success',
        message: 'User registered successfully',
        data: user.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authServiceInstance.login(req.body.username, req.body.password);
      res.status(200).json({
        status: 'Success',
        message: 'Login successful',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'Error', message: 'Unauthorized' });
        return;
      }
      const profile = await authServiceInstance.getUserProfile(req.user.id);
      res.status(200).json({
        status: 'Success',
        data: profile
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authControllerInstance = new AuthController();
