import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { sendError } from '../utils/apiResponse';
import { ErrorCodes } from '../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — CONFIGURATION DE SÉCURITÉ HTTP & POLITIQUE CORS
 * ============================================================================
 * Sécurise les en-têtes HTTP via Helmet et applique une politique CORS stricte
 * basée sur la liste blanche d'origines autorisées (sans wildcard).
 * ============================================================================
 */

/**
 * En-têtes HTTP sécurisés via Helmet
 */
export const helmetSecurity = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...env.allowedOriginsArray],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Middleware CORS avec contrôle strict de l'origine
 */
export const corsSecurity = cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (ex. : tests, outils serveurs)
    if (!origin) {
      return callback(null, true);
    }

    if (env.allowedOriginsArray.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origine non autorisée par la politique CORS KevyLab'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Idempotency-Key'
  ],
  maxAge: 86400
});

/**
 * Assainissement basique contre les injections de clés NoSQL interdites ($, .)
 */
export const sanitizePayload = (req: Request, res: Response, next: NextFunction): void => {
  const cleanObject = (obj: Record<string, unknown>): boolean => {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        return false;
      }
      const val = obj[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        if (!cleanObject(val as Record<string, unknown>)) return false;
      }
    }
    return true;
  };

  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    if (!cleanObject(req.body)) {
      sendError(
        res,
        400,
        ErrorCodes.VALIDATION_ERROR,
        'La charge utile transmise contient des caractères d’injection non autorisés.'
      );
      return;
    }
  }

  next();
};
