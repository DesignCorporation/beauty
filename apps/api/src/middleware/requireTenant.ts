// TP-02 T5: Require tenant helper middleware

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that ensures tenant context is present
 * Returns 400 if req.tenant?.salonId is missing
 */
export const requireTenant = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.tenant?.salonId) {
    res.status(400).json({
      error: 'TENANT_REQUIRED',
      message: 'This endpoint requires a valid salon context'
    });
    return;
  }

  next();
};

/**
 * Middleware that ensures authenticated user with tenant access
 * Returns 401 if no user, 400 if no tenant, 403 if tenant mismatch
 */
export const requireAuthenticatedTenant = (req: Request, res: Response, next: NextFunction): void => {
  // Check if user is authenticated (JWT verification should happen before this)
  if (!req.tenant?.userId) {
    res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'This endpoint requires authentication'
    });
    return;
  }

  // Check if tenant context exists
  if (!req.tenant?.salonId) {
    res.status(400).json({
      error: 'TENANT_REQUIRED',
      message: 'This endpoint requires a valid salon context'
    });
    return;
  }

  next();
};

/**
 * Middleware that checks if user has specific role within tenant
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tenant?.role || !allowedRoles.includes(req.tenant.role)) {
      res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `This endpoint requires one of the following roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
};
