import { SubmissionStatus } from '../types/enums';
import { AppError } from '../utils/apiResponse';
import { ErrorCodes } from '../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — MACHINE À ÉTATS DE GESTION DES CANDIDATURES
 * ============================================================================
 * Contrôle strictement les transitions autorisées et interdit les sauts illégaux
 * (ex. REJECTED -> WINNER sans réouverture explicite, PENDING -> WINNER direct).
 * ============================================================================
 */

export class SubmissionStateMachine {
  /**
   * Table de transition d'états
   */
  private static readonly allowedTransitions: Record<SubmissionStatus, SubmissionStatus[]> = {
    [SubmissionStatus.DRAFT]: [SubmissionStatus.PENDING, SubmissionStatus.WITHDRAWN],
    [SubmissionStatus.PENDING]: [SubmissionStatus.UNDER_REVIEW, SubmissionStatus.WITHDRAWN],
    [SubmissionStatus.UNDER_REVIEW]: [
      SubmissionStatus.NEEDS_INFORMATION,
      SubmissionStatus.SHORTLISTED,
      SubmissionStatus.REJECTED
    ],
    [SubmissionStatus.NEEDS_INFORMATION]: [
      SubmissionStatus.UNDER_REVIEW,
      SubmissionStatus.REJECTED,
      SubmissionStatus.WITHDRAWN
    ],
    [SubmissionStatus.SHORTLISTED]: [
      SubmissionStatus.ACCEPTED,
      SubmissionStatus.REJECTED,
      SubmissionStatus.UNDER_REVIEW
    ],
    [SubmissionStatus.ACCEPTED]: [
      SubmissionStatus.WINNER,
      SubmissionStatus.REJECTED
    ],
    [SubmissionStatus.REJECTED]: [
      // Réouverture exceptionnelle vers revue uniquement
      SubmissionStatus.UNDER_REVIEW,
      SubmissionStatus.ARCHIVED
    ],
    [SubmissionStatus.WINNER]: [SubmissionStatus.ARCHIVED],
    [SubmissionStatus.WITHDRAWN]: [SubmissionStatus.ARCHIVED],
    [SubmissionStatus.ARCHIVED]: []
  };

  /**
   * Vérifie la validité d'une transition
   */
  static canTransition(current: SubmissionStatus, next: SubmissionStatus): boolean {
    const targets = this.allowedTransitions[current];
    return targets ? targets.includes(next) : false;
  }

  /**
   * Valide la transition et lève une exception descriptive si elle est illégale
   */
  static validateTransition(current: SubmissionStatus, next: SubmissionStatus): void {
    if (current === next) return;

    // Règle explicite du cahier des charges : PENDING -> WINNER interdit
    if (current === SubmissionStatus.PENDING && next === SubmissionStatus.WINNER) {
      throw AppError.badRequest(
        ErrorCodes.INVALID_STATUS_TRANSITION,
        'Une candidature en attente (PENDING) ne peut pas être déclarée directement lauréate.'
      );
    }

    // Règle explicite du cahier des charges : REJECTED -> WINNER interdit
    if (current === SubmissionStatus.REJECTED && next === SubmissionStatus.WINNER) {
      throw AppError.badRequest(
        ErrorCodes.INVALID_STATUS_TRANSITION,
        'Une candidature rejetée ne peut pas devenir lauréate sans réouverture administrative préalable.'
      );
    }

    if (!this.canTransition(current, next)) {
      throw AppError.badRequest(
        ErrorCodes.INVALID_STATUS_TRANSITION,
        `La transition de statut depuis "${current}" vers "${next}" n’est pas autorisée par le workflow.`
      );
    }
  }
}
