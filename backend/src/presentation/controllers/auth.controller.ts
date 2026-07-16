import { Request, Response, NextFunction } from 'express';
import { getAuthService } from '../../application/services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Controller handling user registration, login, and profile lookups.
 * Strictly validates inputs, authorizes roles, and delegates business rules to AuthService.
 */
export class AuthController {
  /**
   * Registers a new user.
   */
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authService = getAuthService();
      const user = await authService.register({
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

  /**
   * Authenticats user credentials and returns a secure JWT token.
   */
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authService = getAuthService();
      const result = await authService.login(req.body.username, req.body.password);
      res.status(200).json({
        status: 'Success',
        message: 'Login successful',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves profile details of the authenticated caller.
   */
  public async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userPayload = req.user;
      if (!userPayload) {
        res.status(401).json({ status: 'Error', message: 'Unauthorized' });
        return;
      }
      const authService = getAuthService();
      const profile = await authService.getUserProfile(userPayload.id);
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
