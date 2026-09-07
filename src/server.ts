import { app } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';

/**
 * ============================================================================
 * KEVYLAB — POINT D'ENTRÉE DU SERVEUR HTTP
 * ============================================================================
 * Initialise la connexion à MongoDB puis démarre l'écoute HTTP.
 * Prend en charge l'arrêt gracieux (Graceful Shutdown) pour libérer les ressources.
 * ============================================================================
 */

const startServer = async (): Promise<void> => {
  try {
    // 1. Établissement de la connexion MongoDB
    await connectDatabase();

    // 2. Démarrage de l'écoute réseau
    const server = app.listen(env.PORT, () => {
      logger.info('SYSTEM', `Serveur KevyLab démarré avec succès en mode [${env.NODE_ENV}]`, {
        port: env.PORT,
        pid: process.pid
      });
      console.log(`\x1b[32mServeur KevyLab opérationnel : http://localhost:${env.PORT}\x1b[0m`);
    });

    // 3. Gestion de l'arrêt gracieux
    const shutdown = async (signal: string) => {
      logger.info('SYSTEM', `Signal ${signal} intercepté. Arrêt gracieux en cours...`);
      server.close(async () => {
        await disconnectDatabase();
        logger.info('SYSTEM', 'Serveur arrêté proprement.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error('SYSTEM', 'Échec critique au démarrage du serveur KevyLab', error);
    process.exit(1);
  }
};

startServer();
