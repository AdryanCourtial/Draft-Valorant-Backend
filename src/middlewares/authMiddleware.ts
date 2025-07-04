import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/jwtInterface';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT.
 * It checks for the presence of a token in the Authorization header,
 * verifies it, and attaches the decoded user information to the request object.
 */
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader?.split(' ')[1];

  const cookieToken = req.cookies?.session;

  const token = headerToken || cookieToken;

  if (!token) {
    res.status(401).json({ message: 'Accès non autorisé (token manquant)' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Accès non autorisé (token invalide)' });
  }
};


export default authMiddleware;
