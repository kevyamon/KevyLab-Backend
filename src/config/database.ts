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
    console.log(`✅ MongoDB connecté avec succès : ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Erreur critique lors de la connexion à MongoDB :', error);
    process.exit(1);
  }
};

// Surveillance des événements de connexion
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Avertissement : Déconnexion de la base de données MongoDB survenue.');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Erreur de flux de la base de données MongoDB :', err);
});

/**
 * Fermeture sécurisée de la connexion lors de l'arrêt du processus
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('🔒 Connexion MongoDB fermée proprement.');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture de la connexion MongoDB :', error);
  }
};
