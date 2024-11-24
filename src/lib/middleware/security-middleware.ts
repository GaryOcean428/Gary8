import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';
import { thoughtLogger } from '../utils/logger';
import { AppError } from '../error/app-error';

export class SecurityMiddleware {
  static async authenticate(
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => Promise<void>
  ): Promise<void> {
    try {
      const token = this.extractToken(req);
      if (!token) {
        throw new AppError('No authentication token provided', 'AUTH_ERROR');
      }

      const decoded = await this.verifyToken(token);
      req.user = decoded;

      // Rate limiting check
      await this.checkRateLimit(req);

      // Input validation
      this.validateInput(req);

      await next();
    } catch (error) {
      thoughtLogger.error('Authentication failed', { error });
      res.status(401).json({ error: 'Authentication failed' });
    }
  }

  private static extractToken(req: NextApiRequest): string | null {
    const authHeader = req.headers.authorization;
    return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  }

  private static async verifyToken(token: string): Promise<any> {
    try {
      return verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      throw new AppError('Invalid token', 'AUTH_ERROR');
    }
  }

  private static async checkRateLimit(req: NextApiRequest): Promise<void> {
    // Implement rate limiting logic here
  }

  private static validateInput(req: NextApiRequest): void {
    // Implement input validation logic here
  }
} 