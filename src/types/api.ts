import { Request } from 'express';
import { AdminRole } from './enums';

/**
 * ============================================================================
 * KEVYLAB — CONTRATS DE L'API REST & TYPAGES HTTP
 * ============================================================================
 * Définit la structure des réponses standardisées de l'API (succès et échec),
 * la pagination et le contexte des requêtes authentifiées.
 * ============================================================================
 */

/**
 * Métadonnées de pagination retournées par les listes
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Format normalisé d'une réponse réussie de l'API REST
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  pagination?: PaginationMeta;
}

/**
 * Détail d'une erreur de validation ou d'un champ invalide
 */
export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

/**
 * Format normalisé d'une réponse d'erreur de l'API REST
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | unknown[];
  };
}

/**
 * Type unifié pour toute réponse issue de l'API
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Paramètres de requête de pagination standard
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/**
 * Contenu décodé du jeton d'authentification JWT administrateur
 */
export interface AdminTokenPayload {
  id: string;
  email: string;
  role: AdminRole;
  permissions: string[];
}

/**
 * Extension de la requête Express pour injecter l'administrateur connecté
 */
export interface AuthenticatedRequest extends Request {
  admin?: AdminTokenPayload;
}
