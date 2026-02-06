import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@suvidha/database';
import { ApiError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phone: string;
    name: string;
    email?: string;
    role: string;
    language: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'suvidha-secret-key-change-in-production';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      phone: string;
      role: string;
    };

    // Verify session exists
    const session = await prisma.session.findFirst({
      where: {
        userId: decoded.userId,
        token: token,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      throw new ApiError('Session expired or invalid', 401);
    }

    req.user = {
      id: session.user.id,
      phone: session.user.phone,
      name: session.user.name,
      email: session.user.email || undefined,
      role: session.user.role,
      language: session.user.language,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError('Insufficient permissions', 403));
    }

    next();
  };
};
