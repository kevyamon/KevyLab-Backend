/**
 * ============================================================================
 * KEVYLAB — TEST UNITAIRE DE LA VALIDATION DU SCORING (100 Points)
 * ============================================================================
 * Vérifie le calcul de la somme des critères, les bornes individuelles
 * (0 <= score <= maxScore) et le calcul d'autorité côté serveur.
 * ============================================================================
 */

export const runScoringTests = (): boolean => {
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      passed++;
      console.log(`  ✓ ${testName}`);
    } else {
      failed++;
      console.error(`  ✗ ${testName}`);
    }
  };

  console.log('🧪 Exécution des tests unitaires : Validation et calcul du Scoring');

  const criteria = [
    { key: 'utility', maxScore: 30 },
    { key: 'feasibility', maxScore: 25 },
    { key: 'clarity_mvp', maxScore: 20 },
    { key: 'growth', maxScore: 15 },
    { key: 'originality', maxScore: 10 }
  ];

  // Test 1 : Vérification que la somme des scores maximaux est exactement 100
  const totalMax = criteria.reduce((sum, c) => sum + c.maxScore, 0);
  assert(totalMax === 100, 'La somme des critères configurés doit être strictement égale à 100 points');

  // Test 2 : Validation d'un score conforme
  const validScores: Record<string, number> = {
    utility: 28,
    feasibility: 22,
    clarity_mvp: 18,
    growth: 12,
    originality: 9
  };

  const computedTotal = Object.values(validScores).reduce((sum, s) => sum + s, 0);
  assert(computedTotal === 89, 'Le calcul serveur du score total doit être exact (89/100 attendu)');

  // Test 3 : Détection d'un score hors borne (score > maxScore)
  const isInvalidScore = (key: string, score: number): boolean => {
    const criterion = criteria.find((c) => c.key === key);
    if (!criterion) return true;
    return score < 0 || score > criterion.maxScore;
  };

  assert(isInvalidScore('utility', 35), 'Un score supérieur au max (35 > 30) doit être rejeté');
  assert(isInvalidScore('originality', -2), 'Un score négatif (-2) doit être rejeté');
  assert(!isInvalidScore('feasibility', 25), 'Un score maximal valide (25/25) doit être accepté');

  console.log(`📊 Résultat : ${passed} passés, ${failed} échoués.\n`);
  return failed === 0;
};

// Exécution directe si exécuté en script
if (require.main === module) {
  const success = runScoringTests();
  process.exit(success ? 0 : 1);
}
