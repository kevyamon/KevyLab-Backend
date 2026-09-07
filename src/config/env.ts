import dotenv from 'dotenv';
import { z } from 'zod';

// Chargement initial des variables d'environnement
dotenv.config();

/**
 * ============================================================================
 * KEVYLAB — SCHÉMA DE VALIDATION DES VARIABLES D'ENVIRONNEMENT
 * ============================================================================
 * Garantit que toutes les variables critiques sont présentes et valides
 * avant le démarrage du serveur, évitant tout crash ultérieur à l'exécution.
 * ============================================================================
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),

  // Base de données
  MONGODB_URI: z.string().min(1, 'La chaîne de connexion MONGODB_URI est obligatoire'),

  // Sécurité et Authentification JWT
  JWT_SECRET: z.string().min(32, 'Le JWT_SECRET doit contenir au moins 32 caractères'),
  JWT_REFRESH_SECRET: z.string().min(32, 'Le JWT_REFRESH_SECRET doit contenir au moins 32 caractères'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION_DAYS: z.string().default('7').transform((val) => parseInt(val, 10)),

  // Secret Maître d'Inscription Administrateur sur Render
  ADMIN_PW: z.string().min(8, 'Le mot de passe maître ADMIN_PW doit comporter au moins 8 caractères'),

  // Service d'Email Transactionnel Brevo
  BREVO_API_KEY: z.string().optional().default(''),
  BREVO_SENDER_EMAIL: z.string().email().optional().default('contact@kevylab.com'),
  BREVO_SENDER_NAME: z.string().optional().default('KevyLab'),

  // Configuration CORS & Origines Autorisées
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Échec critique lors de la validation des variables d’environnement :');
  console.error(parsedEnv.error.format());
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
  // Transformation de la liste des origines autorisées en tableau
  allowedOriginsArray: parsedEnv.data.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
};
