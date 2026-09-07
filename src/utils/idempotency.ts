import { Request, Response, NextFunction } from 'express';
import { sendError } from './apiResponse';
import { ErrorCodes } from '../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — GESTIONNAIRE D'IDEMPOTENCE ANTI DOUBLE-CLIC
 * ============================================================================
 * Empêche le traitement multiple accidentel d'une même candidature
 * via l'en-tête "X-Idempotency-Key" avec expiration automatique (TTL de 5 min).
 * ============================================================================
 */

interface IdempotencyRecord {
  status: 'PROCESSING' | 'COMPLETED';
  responseStatus?: number;
  responseBody?: unknown;
  createdAt: number;
}

// Magasin en mémoire avec nettoyage automatique des clés expirées
const idempotencyStore = new Map<string, IdempotencyRecord>();
const TTL_MILLISECONDS = 5 * 60 * 1000; // 5 minutes

// Nettoyage périodique toutes les 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of idempotencyStore.entries()) {
    if (now - record.createdAt > TTL_MILLISECONDS) {
      idempotencyStore.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

export const checkIdempotency = (req: Request, res: Response, next: NextFunction): void => {
  const idempotencyKey = req.header('X-Idempotency-Key');

  // Si aucune clé fournie, poursuivre normalement
  if (!idempotencyKey) {
    return next();
  }

  const existingRecord = idempotencyStore.get(idempotencyKey);

  if (existingRecord) {
    if (existingRecord.status === 'PROCESSING') {
      sendError(
        res,
        409,
        ErrorCodes.IDEMPOTENCY_CONFLICT,
        'Une requête identique avec cette clé est actuellement en cours de traitement.'
      );
      return;
    }

    if (existingRecord.status === 'COMPLETED' && existingRecord.responseBody) {
      res.status(existingRecord.responseStatus || 200).json(existingRecord.responseBody);
      return;
    }
  }

  // Enregistrer le début du traitement
  idempotencyStore.set(idempotencyKey, {
    status: 'PROCESSING',
    createdAt: Date.now()
  });

  // Intercepter l'envoi de la réponse pour la mettre en cache
  const originalJson = res.json.bind(res);
  res.json = (body: unknown): Response => {
    idempotencyStore.set(idempotencyKey, {
      status: 'COMPLETED',
      responseStatus: res.statusCode,
      responseBody: body,
      createdAt: Date.now()
    });
    return originalJson(body);
  };

  next();
};
