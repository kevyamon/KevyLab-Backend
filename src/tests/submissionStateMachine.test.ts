import { SubmissionStateMachine } from '../services/submissionStateMachine';
import { SubmissionStatus } from '../types/enums';

/**
 * ============================================================================
 * KEVYLAB — TEST UNITAIRE DE LA MACHINE À ÉTATS (SubmissionStateMachine)
 * ============================================================================
 * Vérifie l'autorisation des transitions régulières et le blocage formel
 * des sauts illégaux (notamment PENDING -> WINNER et REJECTED -> WINNER).
 * ============================================================================
 */

export const runStateMachineTests = (): boolean => {
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      passed++;
      console.log(`  \x1b[32m[PASS]\x1b[0m ${testName}`);
    } else {
      failed++;
      console.error(`  \x1b[31m[FAIL]\x1b[0m ${testName}`);
    }
  };

  console.log('[TEST] Machine à états des candidatures');

  // Test 1 : Transitions autorisées
  assert(
    SubmissionStateMachine.canTransition(SubmissionStatus.PENDING, SubmissionStatus.UNDER_REVIEW),
    'Transition PENDING -> UNDER_REVIEW doit être autorisée'
  );

  assert(
    SubmissionStateMachine.canTransition(SubmissionStatus.UNDER_REVIEW, SubmissionStatus.SHORTLISTED),
    'Transition UNDER_REVIEW -> SHORTLISTED doit être autorisée'
  );

  assert(
    SubmissionStateMachine.canTransition(SubmissionStatus.SHORTLISTED, SubmissionStatus.ACCEPTED),
    'Transition SHORTLISTED -> ACCEPTED doit être autorisée'
  );

  assert(
    SubmissionStateMachine.canTransition(SubmissionStatus.ACCEPTED, SubmissionStatus.WINNER),
    'Transition ACCEPTED -> WINNER doit être autorisée'
  );

  // Test 2 : Sauts formellement interdits
  assert(
    !SubmissionStateMachine.canTransition(SubmissionStatus.PENDING, SubmissionStatus.WINNER),
    'Saut direct PENDING -> WINNER doit être strictement interdit'
  );

  assert(
    !SubmissionStateMachine.canTransition(SubmissionStatus.REJECTED, SubmissionStatus.WINNER),
    'Saut direct REJECTED -> WINNER doit être strictement interdit'
  );

  assert(
    !SubmissionStateMachine.canTransition(SubmissionStatus.ARCHIVED, SubmissionStatus.ACCEPTED),
    'Aucune transition depuis ARCHIVED ne doit être permise'
  );

  // Test 3 : Gestion des exceptions levées par validateTransition
  let pendingToWinnerThrew = false;
  try {
    SubmissionStateMachine.validateTransition(SubmissionStatus.PENDING, SubmissionStatus.WINNER);
  } catch {
    pendingToWinnerThrew = true;
  }
  assert(pendingToWinnerThrew, 'validateTransition(PENDING, WINNER) doit lever une AppError explicite');

  let rejectedToWinnerThrew = false;
  try {
    SubmissionStateMachine.validateTransition(SubmissionStatus.REJECTED, SubmissionStatus.WINNER);
  } catch {
    rejectedToWinnerThrew = true;
  }
  assert(rejectedToWinnerThrew, 'validateTransition(REJECTED, WINNER) doit lever une AppError explicite');

  console.log(`[BILAN] ${passed} passés, ${failed} échoués.\n`);
  return failed === 0;
};

// Exécution directe si exécuté en script
if (require.main === module) {
  const success = runStateMachineTests();
  process.exit(success ? 0 : 1);
}
