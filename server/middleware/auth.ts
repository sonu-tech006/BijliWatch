import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { localStore } from '../db/store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bijliwatch_super_secure_jwt_secret_change_in_production';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'consumer' | 'local_admin' | 'district_admin' | 'state_admin';
  state: string;
  district: string;
  locality?: string;
  panchayat?: string;
  department?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      state: user.state,
      district: user.district,
      locality: user.locality,
      panchayat: user.panchayat,
      department: user.department,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
    return;
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Authorized role required (${allowedRoles.join(' or ')}).`,
      });
      return;
    }

    next();
  };
}

export function auditLog(
  action: string,
  actor: AuthenticatedUser,
  targetId: string,
  targetType: string,
  details: Record<string, any> = {},
  ipAddress?: string
) {
  const newAudit = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    _id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    action,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    targetId,
    targetType,
    details,
    ipAddress: ipAddress || '127.0.0.1',
    createdAt: new Date().toISOString(),
  };

  localStore.auditLogs.unshift(newAudit);
  return newAudit;
}
