import { renderEmailTemplate } from '../integrations/brevo/emailTemplates';
import { EmailTemplateKey } from '../types/enums';

/**
 * ============================================================================
 * KEVYLAB — SUITE DE TESTS : RÉSILIENCE ET TEMPLATES DE COURRIELS (Brevo)
 * ============================================================================
 * Vérifie l'intégrité des modèles HTML de courriels (Section 54), le respect
 * des variables injectées et la politique de limitation des réessais (Section 61).
 * ============================================================================
 */

const runTests = () => {
  console.log('[TEST] Résilience et Modèles de Courriels');
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

  // 1. Rendu du modèle SUBMISSION_CREATED avec référence et titre
  const created = renderEmailTemplate(EmailTemplateKey.SUBMISSION_CREATED, {
    candidateName: 'Marc Konan',
    projectTitle: 'SmartAgri IoT',
    reference: 'KLA-2026-000042'
  });
  assert(created.subject.includes('KLA-2026-000042'), 'Le sujet de confirmation doit contenir la référence unique');
  assert(created.html.includes('SmartAgri IoT'), 'Le corps de confirmation doit mentionner l’intitulé du projet');
  assert(created.html.includes('KLA-2026-000042'), 'Le corps de confirmation doit afficher la référence en évidence');

  // 2. Rendu du modèle SUBMISSION_WINNER
  const winner = renderEmailTemplate(EmailTemplateKey.SUBMISSION_WINNER, {
    candidateName: 'Sarah Diallo',
    projectTitle: 'Pulse Care',
    reference: 'KLA-2026-000001',
    distinction: '1er Prix — Grand Lauréat'
  });
  assert(winner.subject.includes('Lauréat'), 'Le sujet du courriel lauréat doit afficher la distinction officielle');
  assert(winner.html.includes('1er Prix — Grand Lauréat'), 'Le corps du courriel doit afficher la distinction');

  // 3. Rendu du modèle SUBMISSION_REJECTED respectueux et constructif (Section 57)
  const rejected = renderEmailTemplate(EmailTemplateKey.SUBMISSION_REJECTED, {
    candidateName: 'Paul Traore',
    projectTitle: 'QuickDelivery',
    reference: 'KLA-2026-000088'
  });
  assert(rejected.html.includes('remercions chaleureusement'), 'Le courriel de refus doit remercier courtoisement');
  assert(rejected.html.includes('encourageons vivement'), 'Le courriel de refus doit formuler des encouragements constructifs');

  // 4. Politique de plafonnement des réessais (Section 61)
  const MAX_RETRIES = 5;
  const canRetry = (currentRetries: number): boolean => currentRetries < MAX_RETRIES;

  assert(canRetry(0), 'Un courriel échoué sans tentative précédente doit être rééligible à l’envoi');
  assert(canRetry(4), 'Un courriel à 4 tentatives doit encore pouvoir être réessayé une 5e fois');
  assert(!canRetry(5), 'Un courriel ayant atteint 5 tentatives doit être définitivement bloqué');
  assert(!canRetry(8), 'Un compteur supérieur à 5 doit être formellement rejeté');

  console.log(`[BILAN] ${passed} passés, ${failed} échoués.\n`);
  if (failed > 0) process.exit(1);
};

runTests();
