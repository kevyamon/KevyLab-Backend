import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { sendError } from '../utils/apiResponse';
import { ErrorCodes } from '../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — LIMITEURS DE DÉBIT HTTP (RATE LIMITING)
 * ============================================================================
 * Protège les points d'entrée contre les attaques par déni de service (DoS),
 * les tentatives de force brute sur l'authentification et le spam de formulaires.
 * ============================================================================
 */

/**
 * Gestionnaire unifié de dépassement de quota
 */
const createRateLimitHandler = (message: string) => {
  return (_req: Request, res: Response): void => {
    sendError(res, 429, ErrorCodes.RATE_LIMITED, message);
  };
};

/**
 * Limiteur général applicable à l'ensemble de l'API publique
 * (100 requêtes par tranche de 15 minutes par adresse IP)
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(
    'Trop de requêtes ont été émises depuis votre adresse IP. Veuillez patienter 15 minutes avant de réitérer.'
  )
});

/**
 * Limiteur renforcé contre les attaques par force brute (Authentification)
 * (5 tentatives échouées autorisées par tranche de 15 minutes)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: createRateLimitHandler(
    'Nombre excessif de tentatives de connexion échouées. Par mesure de sécurité, l’accès est temporairement bloqué pendant 15 minutes.'
  )
});

/**
 * Limiteur spécifique aux dépôts de candidatures (Anti-flood)
 * (10 candidatures maximum par heure par adresse IP)
 */
export const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(
    'La fréquence maximale de soumission de candidatures a été atteinte. Veuillez patienter avant de soumettre à nouveau.'
  )
});

/**
 * Limiteur pour le formulaire de contact (Anti-spam)
 * (5 messages par tranche de 15 minutes)
 */
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(
    'Limite d’envoi de messages de contact atteinte. Merci de patienter quelques instants.'
  )
});
