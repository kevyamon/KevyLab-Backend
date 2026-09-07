/**
 * ============================================================================
 * KEVYLAB — CODES D'ERREUR STANDARDISÉS DE L'API
 * ============================================================================
 * Constantes d'erreurs normalisées retournées dans le champ "error.code"
 * de chaque réponse HTTP en échec, conformément au Cahier des Charges.
 * ============================================================================
 */

export const ErrorCodes = {
  // Événements
  EVENT_NOT_FOUND: 'EVENT_NOT_FOUND',
  APPLICATIONS_NOT_OPEN: 'APPLICATIONS_NOT_OPEN',
  APPLICATIONS_CLOSED: 'APPLICATIONS_CLOSED',

  // Candidatures
  SUBMISSION_NOT_FOUND: 'SUBMISSION_NOT_FOUND',
  SUBMISSION_DUPLICATE: 'SUBMISSION_DUPLICATE',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',

  // Notation et Revue
  INVALID_SCORE: 'INVALID_SCORE',
  CRITERION_NOT_FOUND: 'CRITERION_NOT_FOUND',
  SCORE_EXCEEDS_MAX: 'SCORE_EXCEEDS_MAX',

  // Courriels et Notifications
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  EMAIL_LOG_NOT_FOUND: 'EMAIL_LOG_NOT_FOUND',

  // Authentification et Autorisation
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_ADMIN_SECRET: 'INVALID_ADMIN_SECRET',
  ACCOUNT_DEACTIVATED: 'ACCOUNT_DEACTIVATED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Sécurité et Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
