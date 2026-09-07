import mongoose from 'mongoose';
import { env } from './env';

/**
 * ============================================================================
 * KEVYLAB — GESTIONNAIRE DE CONNEXION MONGODB
 * ============================================================================
 * Assure une connexion robuste avec pool de connexions, temporisations
 * adaptées et surveillance continue de l'état de la base de données.
 * ============================================================================
 */

export const connectDatabase = async (): Promise<typeof mongoose> => {
  const options: mongoose.ConnectOptions = {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  };

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, options);
    console.log(`\x1b[32mMongoDB connecté avec succès : ${conn.connection.host}\x1b[0m`);
    return conn;
  } catch (error) {
    console.error('\x1b[31m[ERREUR] Erreur critique lors de la connexion à MongoDB :\x1b[0m', error);
    process.exit(1);
    throw error;
  }
};

// Surveillance des événements de connexion
mongoose.connection.on('disconnected', () => {
  console.warn('\x1b[33m[AVERTISSEMENT] Déconnexion de la base de données MongoDB survenue.\x1b[0m');
});

mongoose.connection.on('error', (err) => {
  console.error('\x1b[31m[ERREUR] Erreur de flux de la base de données MongoDB :\x1b[0m', err);
});

/**
 * Fermeture sécurisée de la connexion lors de l'arrêt du processus
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('\x1b[32mConnexion MongoDB fermée proprement.\x1b[0m');
  } catch (error) {
    console.error('\x1b[31m[ERREUR] Erreur lors de la fermeture de la connexion MongoDB :\x1b[0m', error);
  }
};
