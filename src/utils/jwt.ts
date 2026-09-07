import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AdminTokenPayload } from '../types/api';

/**
 * ============================================================================
 * KEVYLAB — GESTIONNAIRE DE JETONS CRYPTOGRAPHIQUES JWT
 * ============================================================================
 * Génère et valide les jetons d'accès courts (15 min) et les jetons de
 * rafraîchissement (7 jours) pour sécuriser l'authentification administrative.
 * ============================================================================
 */

/**
 * Génère un jeton d'accès signé
 */
export const signAccessToken = (payload: AdminTokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m'
  });
};

/**
 * Génère un jeton de rafraîchissement signé
 */
export const signRefreshToken = (payload: AdminTokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });
};

/**
 * Vérifie et décode un jeton d'accès
 */
export const verifyAccessToken = (token: string): AdminTokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as AdminTokenPayload;
};

/**
 * Vérifie et décode un jeton de rafraîchissement
 */
export const verifyRefreshToken = (token: string): AdminTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AdminTokenPayload;
};
