import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Database, User } from '../database/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthenticatedRequest extends Request {
  user?: User;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header provided',
      });
    }

    let token: string;
    let authType: 'Bearer' | 'ApiKey';

    // Support both JWT Bearer tokens and API keys
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      authType = 'Bearer';
    } else if (authHeader.startsWith('ApiKey ')) {
      token = authHeader.substring(7);
      authType = 'ApiKey';
    } else {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format. Use "Bearer <token>" or "ApiKey <key>"',
      });
    }

    let user: User | null = null;

    if (authType === 'Bearer') {
      // JWT token authentication
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        user = await Database.getConnection()('users')
          .where({ id: decoded.userId })
          .first();
      } catch (jwtError) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        });
      }
    } else {
      // API key authentication
      user = await Database.getUserByApiKey(token);
    }

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
};

export const generateJWT = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

export const generateApiKey = (): string => {
  return 'jsk_' + crypto.randomUUID().replace(/-/g, '');
};