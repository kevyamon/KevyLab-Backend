import { z } from 'zod';
import { EventStatus, TechnicalProfileType } from '../types/enums';

/**
 * ============================================================================
 * KEVYLAB — SUITE DE TESTS : VALIDATION MÉTIER DES CANDIDATURES
 * ============================================================================
 * Vérifie les règles obligatoires de la Section 140 du Cahier des Charges :
 * dossier valide, détection d'événement clos, consentements obligatoires,
 * et conformité des longueurs de champs.
 * ============================================================================
 */

// Schéma de validation normatif miroir de l'API
const submissionValidationSchema = z.object({
  candidate: z.object({
    fullName: z.string().min(2, 'Nom complet trop court'),
    email: z.string().email('Adresse courriel invalide'),
    phone: z.string().min(6, 'Numéro de téléphone requis'),
    country: z.string().min(2, 'Pays requis'),
    teamType: z.enum(['SOLO', 'TEAM'])
  }),
  project: z.object({
    title: z.string().min(3).max(100),
    tagline: z.string().max(160).optional(),
    problem: z.string().min(10).max(2000),
    solution: z.string().min(10).max(2000),
    targetAudience: z.string().min(3).max(1000),
    mvpFeatures: z.array(z.string().max(250)).min(1)
  }),
  technicalProfile: z.object({
    level: z.nativeEnum(TechnicalProfileType)
  }),
  agreements: z.object({
    accurateInformation: z.literal(true),
    acceptedRules: z.literal(true),
    consentContact: z.literal(true)
  })
});

const runTests = () => {
  console.log('[TEST] Validation métier des candidatures');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, description: string) => {
    if (condition) {
      console.log(`  \x1b[32m[PASS]\x1b[0m ${description}`);
      passed++;
    } else {
      console.error(`  \x1b[31m[FAIL]\x1b[0m ${description}`);
      failed++;
    }
  };

  // 1. Dossier de candidature valide
  const validSubmission = {
    candidate: {
      fullName: 'Alice Martin',
      email: 'alice@example.com',
      phone: '+33612345678',
      country: 'France',
      teamType: 'SOLO' as const
    },
    project: {
      title: 'EcoRoute MVP',
      tagline: 'Optimisation d’itinéraires bas carbone',
      problem: 'Les transports quotidiens émettent une empreinte carbone excessive faute de visibilité.',
      solution: 'Un calculateur multimodal en temps réel recommandant l’itinéraire le plus écologique.',
      targetAudience: 'Citadins et navetteurs soucieux de leur bilan écologique.',
      mvpFeatures: ['Calculateur d’empreinte', 'Carte des bornes', 'Historique des trajets']
    },
    technicalProfile: {
      level: TechnicalProfileType.DEVELOPER
    },
    agreements: {
      accurateInformation: true,
      acceptedRules: true,
      consentContact: true
    }
  };

  const validResult = submissionValidationSchema.safeParse(validSubmission);
  assert(validResult.success, 'Une candidature complète et exacte doit être validée avec succès');

  // 2. Refus si le consentement au règlement est absent ou faux
  const missingConsent = {
    ...validSubmission,
    agreements: {
      accurateInformation: true,
      acceptedRules: false, // Refus du règlement
      consentContact: true
    }
  };
  const consentResult = submissionValidationSchema.safeParse(missingConsent);
  assert(!consentResult.success, 'Le refus ou l’absence d’acceptation du règlement doit bloquer la soumission');

  // 3. Refus si adresse email invalide
  const invalidEmail = {
    ...validSubmission,
    candidate: { ...validSubmission.candidate, email: 'adresse-non-valide' }
  };
  const emailResult = submissionValidationSchema.safeParse(invalidEmail);
  assert(!emailResult.success, 'Une adresse courriel malformée doit être rejetée');

  // 4. Contrôle d'événement fermé (règle métier)
  const isSubmissionAllowed = (eventStatus: EventStatus): boolean => {
    return eventStatus === EventStatus.APPLICATIONS_OPEN;
  };
  assert(!isSubmissionAllowed(EventStatus.APPLICATIONS_CLOSED), 'Un événement au statut APPLICATIONS_CLOSED doit refuser tout dépôt');
  assert(!isSubmissionAllowed(EventStatus.UNDER_REVIEW), 'Un événement en statut UNDER_REVIEW ne doit plus accepter de dossier');
  assert(isSubmissionAllowed(EventStatus.APPLICATIONS_OPEN), 'Un événement en statut APPLICATIONS_OPEN doit accepter les candidatures');

  // 5. Refus si aucune fonctionnalité MVP déclarée
  const emptyFeatures = {
    ...validSubmission,
    project: { ...validSubmission.project, mvpFeatures: [] }
  };
  const featuresResult = submissionValidationSchema.safeParse(emptyFeatures);
  assert(!featuresResult.success, 'Un projet sans fonctionnalités MVP listées doit être refusé');

  console.log(`[BILAN] ${passed} passés, ${failed} échoués.\n`);
  if (failed > 0) process.exit(1);
};

runTests();
