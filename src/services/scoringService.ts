import { eventRepository } from '../repositories/eventRepository';
import { submissionRepository } from '../repositories/submissionRepository';
import { auditRepository } from '../repositories/auditRepository';
import { ISubmission } from '../models/Submission';
import { AuditAction } from '../types/enums';
import { AppError } from '../utils/apiResponse';
import { ErrorCodes } from '../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — MOTEUR D'ÉVALUATION & DE NOTATION ADMINISTRATIVE
 * ============================================================================
 * Valide les notes saisies par rapport aux critères configurés, calcule
 * obligatoirement le score total côté serveur (source d'autorité unique),
 * et garantit la stricte confidentialité des appréciations internes.
 * ============================================================================
 */

export interface EvaluationInput {
  scores: Record<string, number>;
  adminNotes?: string;
}

export class ScoringService {
  /**
   * Enregistre l'évaluation et calcule le score total vérifié
   */
  async submitReview(
    submissionId: string,
    input: EvaluationInput,
    reviewerId: string
  ): Promise<ISubmission> {
    const submission = await submissionRepository.findById(submissionId);
    if (!submission) {
      throw AppError.notFound(ErrorCodes.SUBMISSION_NOT_FOUND, 'Candidature introuvable.');
    }

    // 1. Récupération des critères de l'événement associé
    const criteria = await eventRepository.getCriteriaByEvent(submission.eventId.toString());
    if (criteria.length === 0) {
      throw AppError.badRequest(
        ErrorCodes.CRITERION_NOT_FOUND,
        'Aucun critère d’évaluation configuré pour cet événement.'
      );
    }

    const criteriaMap = new Map(criteria.map((c) => [c.key, c]));

    // 2. Validation stricte de chaque note transmise
    let computedTotalScore = 0;
    const validatedScores: Record<string, number> = {};

    for (const [key, rawScore] of Object.entries(input.scores)) {
      const criterion = criteriaMap.get(key);
      if (!criterion) {
        throw AppError.badRequest(
          ErrorCodes.CRITERION_NOT_FOUND,
          `Le critère "${key}" n’est pas défini dans la grille d’évaluation de cet événement.`
        );
      }

      if (typeof rawScore !== 'number' || isNaN(rawScore)) {
        throw AppError.badRequest(
          ErrorCodes.INVALID_SCORE,
          `La note attribuée au critère "${criterion.label}" doit être un nombre valide.`
        );
      }

      if (rawScore < 0 || rawScore > criterion.maxScore) {
        throw AppError.badRequest(
          ErrorCodes.SCORE_EXCEEDS_MAX,
          `La note pour "${criterion.label}" doit être comprise entre 0 et ${criterion.maxScore}. Reçue : ${rawScore}.`
        );
      }

      validatedScores[key] = rawScore;
      computedTotalScore += rawScore;
    }

    // 3. Persistance de l'évaluation avec calcul serveur
    const updated = await submissionRepository.updateReview(
      submissionId,
      validatedScores,
      computedTotalScore,
      input.adminNotes,
      reviewerId
    );

    if (!updated) {
      throw AppError.internal('Échec lors de la mise à jour de l’évaluation.');
    }

    // 4. Traçabilité dans le journal d'audit
    await auditRepository.log({
      actorId: reviewerId,
      action: AuditAction.SUBMISSION_REVIEWED,
      entityType: 'Submission',
      entityId: submission.id,
      metadata: {
        totalScore: computedTotalScore,
        criteriaCount: Object.keys(validatedScores).length
      }
    });

    return updated;
  }
}

export const scoringService = new ScoringService();
