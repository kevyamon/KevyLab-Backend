/**
 * ============================================================================
 * KEVYLAB — SYSTÈME DE JOURNALISATION STRUCTURÉE & MASQUAGE RGPD
 * ============================================================================
 * Journalise les événements système par catégories tout en anonymisant
 * automatiquement les données sensibles (téléphones, courriels, mots de passe).
 * ============================================================================
 */

export type LogCategory =
  | 'AUTH'
  | 'EVENT'
  | 'SUBMISSION'
  | 'REVIEW'
  | 'EMAIL'
  | 'ADMIN'
  | 'SYSTEM';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogPayload {
  category: LogCategory;
  message: string;
  data?: Record<string, unknown>;
  error?: Error | unknown;
}

/**
 * Anonymise les valeurs textuelles sensibles (courriel, téléphone, clés)
 */
const maskValue = (key: string, value: unknown): unknown => {
  if (typeof value !== 'string') return value;

  const lowerKey = key.toLowerCase();

  // Masquage des mots de passe et jetons
  if (
    lowerKey.includes('password') ||
    lowerKey.includes('secret') ||
    lowerKey.includes('token') ||
    lowerKey.includes('admin_pw') ||
    lowerKey.includes('authorization')
  ) {
    return '********';
  }

  // Masquage partiel des adresses courriel (ex. : j***@domain.com)
  if (lowerKey.includes('email') && value.includes('@')) {
    const [localPart, domain] = value.split('@');
    if (localPart && domain) {
      const visibleChar = localPart.charAt(0);
      return `${visibleChar}***@${domain}`;
    }
  }

  // Masquage des numéros de téléphone (garde les 3 derniers chiffres)
  if (lowerKey.includes('phone') || lowerKey.includes('telephone')) {
    return value.length > 4 ? `+***...${value.slice(-3)}` : '***';
  }

  return value;
};

/**
 * Nettoie récursivement un objet de ses données confidentielles
 */
const sanitizeData = (data: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeData(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        item && typeof item === 'object' ? sanitizeData(item as Record<string, unknown>) : item
      );
    } else {
      sanitized[key] = maskValue(key, value);
    }
  }

  return sanitized;
};

/**
 * Formate et affiche le message dans la console de manière structurée
 */
const formatAndPrint = (level: LogLevel, payload: LogPayload): void => {
  const timestamp = new Date().toISOString();
  const sanitizedData = payload.data ? sanitizeData(payload.data) : undefined;

  const logEntry = {
    timestamp,
    level,
    category: payload.category,
    message: payload.message,
    ...(sanitizedData ? { data: sanitizedData } : {}),
    ...(payload.error instanceof Error
      ? { error: { name: payload.error.name, message: payload.error.message } }
      : payload.error
      ? { error: payload.error }
      : {})
  };

  const output = JSON.stringify(logEntry);

  switch (level) {
    case 'ERROR':
      console.error(output);
      break;
    case 'WARN':
      console.warn(output);
      break;
    default:
      console.log(output);
      break;
  }
};

export const logger = {
  info: (category: LogCategory, message: string, data?: Record<string, unknown>) =>
    formatAndPrint('INFO', { category, message, data }),

  warn: (category: LogCategory, message: string, data?: Record<string, unknown>) =>
    formatAndPrint('WARN', { category, message, data }),

  error: (category: LogCategory, message: string, error?: unknown, data?: Record<string, unknown>) =>
    formatAndPrint('ERROR', { category, message, error, data }),

  debug: (category: LogCategory, message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
      formatAndPrint('DEBUG', { category, message, data });
    }
  }
};
