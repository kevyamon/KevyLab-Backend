import { Response } from 'express';
import { ApiErrorResponse, ApiSuccessResponse, PaginationMeta } from '../types/api';
import { ErrorCode, ErrorCodes } from '../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — UTILITAIRES DE RÉPONSES HTTP NORMALISÉES
 * ============================================================================
 * Centralise l'envoi de réponses conformes aux contrats de l'API REST
 * et définit la classe d'erreur métier standard "AppError".
 * ============================================================================
 */

/**
 * Classe d'erreur métier permettant d'associer un code statut HTTP,
 * un code d'erreur normalisé et des détails complémentaires.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly details?: unknown[];

  constructor(
    statusCode: number,
    errorCode: ErrorCode,
    message: string,
    details?: unknown[]
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(errorCode: ErrorCode, message: string, details?: unknown[]): AppError {
    return new AppError(400, errorCode, message, details);
  }

  static unauthorized(message = 'Authentification requise'): AppError {
    return new AppError(401, ErrorCodes.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Accès non autorisé'): AppError {
    return new AppError(403, ErrorCodes.FORBIDDEN, message);
  }

  static notFound(errorCode: ErrorCode = ErrorCodes.NOT_FOUND, message = 'Ressource introuvable'): AppError {
    return new AppError(404, errorCode, message);
  }

  static conflict(errorCode: ErrorCode, message: string): AppError {
    return new AppError(409, errorCode, message);
  }

  static internal(message = 'Une erreur interne est survenue'): AppError {
    return new AppError(500, ErrorCodes.INTERNAL_ERROR, message);
  }
}

/**
 * Envoie une réponse de succès HTTP standardisée
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  pagination?: PaginationMeta
): Response => {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(pagination ? { pagination } : {})
  };
  return res.status(statusCode).json(payload);
};

/**
 * Envoie une réponse de création de ressource (201 Created)
 */
export const sendCreated = <T>(res: Response, data: T): Response => {
  return sendSuccess(res, data, 201);
};

/**
 * Envoie une réponse d'erreur HTTP normalisée
 */
export const sendError = (
  res: Response,
  statusCode: number,
  errorCode: string,
  message: string,
  details?: unknown[]
): Response => {
  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details ? { details } : {})
    }
  };
  return res.status(statusCode).json(payload);
};
