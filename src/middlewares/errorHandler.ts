import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, sendError } from '../utils/apiResponse';
import { ErrorCodes } from '../constants/errorCodes';
import { logger } from '../utils/logger';

/**
 * ============================================================================
 * KEVYLAB — GESTIONNAIRE GLOBAL D'ERREURS HTTP
 * ============================================================================
 * Intercepte et normalise toutes les exceptions survenant dans l'application.
 * Empêche formellement la divulgation de traces de pile (stack trace) en production.
 * ============================================================================
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Cas 1 : Erreur métier personnalisée (AppError)
  if (err instanceof AppError) {
    logger.warn('SYSTEM', `Erreur métier interceptée : ${err.message}`, {
      path: req.originalUrl,
      method: req.method,
      code: err.errorCode,
      statusCode: err.statusCode
    });

    sendError(res, err.statusCode, err.errorCode, err.message, err.details);
    return;
  }

  // Cas 2 : Erreur de validation Zod
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));

    logger.warn('SYSTEM', 'Échec de validation de la requête', {
      path: req.originalUrl,
      method: req.method,
      details
    });

    sendError(
      res,
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Les informations fournies comportent des données invalides ou incomplètes.',
      details
    );
    return;
  }

  // Cas 3 : Erreurs d'index unique MongoDB (doublon E11000)
  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000) {
    logger.warn('SYSTEM', 'Conflit d’unicité détecté en base de données', {
      path: req.originalUrl,
      method: req.method
    });

    sendError(
      res,
      409,
      ErrorCodes.SUBMISSION_DUPLICATE,
      'Une ressource avec ces caractéristiques uniques est déjà enregistrée.'
    );
    return;
  }

  // Cas 4 : Erreur interne non anticipée (500)
  logger.error('SYSTEM', 'Erreur serveur non gérée', err, {
    path: req.originalUrl,
    method: req.method
  });

  sendError(
    res,
    500,
    ErrorCodes.INTERNAL_ERROR,
    'Une anomalie interne est survenue. L’incident a été journalisé pour analyse.'
  );
};
