import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { AdminRole } from '../types/enums';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';
import { ErrorCodes } from '../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — MIDDLEWARES D'AUTHENTIFICATION & CONTRÔLE D'ACCÈS (RBAC)
 * ============================================================================
 * Protège les routes privées de l'espace d'administration et vérifie
 * les rôles et permissions granulaires des utilisateurs connectés.
 * ============================================================================
 */

/**
 * Exige la présence d'un jeton JWT valide (dans l'en-tête Authorization ou cookie)
 */
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      sendError(
        res,
        401,
        ErrorCodes.UNAUTHORIZED,
        'Authentification requise pour accéder à cette ressource administrative.'
      );
      return;
    }

    const payload = verifyAccessToken(token);
    req.admin = payload;
    next();
  } catch {
    sendError(
      res,
      401,
      ErrorCodes.TOKEN_EXPIRED,
      'Votre session a expiré ou le jeton fourni est invalide. Veuillez vous reconnecter.'
    );
  }
};

/**
 * Restreint l'accès à un ou plusieurs rôles spécifiques
 */
export const requireRole = (...allowedRoles: AdminRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      sendError(res, 401, ErrorCodes.UNAUTHORIZED, 'Authentification requise.');
      return;
    }

    // Le SUPER_ADMIN bénéficie de tous les privilèges
    if (req.admin.role === AdminRole.SUPER_ADMIN || allowedRoles.includes(req.admin.role)) {
      return next();
    }

    sendError(
      res,
      403,
      ErrorCodes.FORBIDDEN,
      'Vos privilèges administratifs ne vous permettent pas d’exécuter cette opération.'
    );
  };
};

/**
 * Vérifie qu'une permission précise est accordée à l'administrateur
 */
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      sendError(res, 401, ErrorCodes.UNAUTHORIZED, 'Authentification requise.');
      return;
    }

    if (
      req.admin.role === AdminRole.SUPER_ADMIN ||
      req.admin.permissions.includes('*') ||
      req.admin.permissions.includes(permission)
    ) {
      return next();
    }

    sendError(
      res,
      403,
      ErrorCodes.FORBIDDEN,
      `La permission "${permission}" est requise pour effectuer cette action.`
    );
  };
};
