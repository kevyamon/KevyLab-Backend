import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { helmetSecurity, corsSecurity, sanitizePayload } from './middlewares/security';
import { apiLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';
import { apiRouter } from './routes/apiRouter';
import { sendError } from './utils/apiResponse';
import { ErrorCodes } from './constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — CONFIGURATION DE L'APPLICATION EXPRESS
 * ============================================================================
 * Configure la chaîne de middlewares de sécurité, le routage central /api/v1
 * et applique la règle furtive : toute URL non-API (/admin, /dashboard, etc.)
 * aboutit immédiatement à une erreur 404 standardisée.
 * ============================================================================
 */

export const app = express();

// Sécurité des en-têtes et politique CORS
app.use(helmetSecurity);
app.use(corsSecurity);

// Décodage des charges utiles JSON et cookies
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Assainissement des données contre les injections
app.use(sanitizePayload);

// Limiteur général de requêtes
app.use('/api', apiLimiter);

// Point d'entrée de santé (Health Check)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Montage du routeur API REST v1
app.use('/api/v1', apiRouter);

// Gestionnaire 404 : Leurre pour routes inexistantes ou directes (/admin, /dashboard, etc.)
app.use((_req: Request, res: Response) => {
  sendError(
    res,
    404,
    ErrorCodes.NOT_FOUND,
    'La ressource demandée n’existe pas ou a été déplacée.'
  );
});

// Gestionnaire global d'exceptions
app.use(errorHandler);
