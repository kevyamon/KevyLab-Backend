import { eventRepository } from '../repositories/eventRepository';
import { auditRepository } from '../repositories/auditRepository';
import { SubmissionModel } from '../models/Submission';
import { IEvent } from '../models/Event';
import { IEvaluationCriterion } from '../models/EvaluationCriterion';
import { AuditAction, EventStatus } from '../types/enums';
import { AppError } from '../utils/apiResponse';
import { ErrorCodes } from '../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — SERVICE MÉTIER : GESTION DES ÉVÉNEMENTS & CRITÈRES
 * ============================================================================
 * Supervise le cycle de vie des événements, la configuration des critères
 * de notation (somme à 100 points) et la publication officielle des résultats.
 * ============================================================================
 */

export class EventService {
  /**
   * Retourne l'édition active actuelle de l'Appathon pour affichage public
   */
  async getActiveAppathon(): Promise<IEvent> {
    const event = await eventRepository.findActiveAppathon();
    if (!event) {
      throw AppError.notFound(ErrorCodes.EVENT_NOT_FOUND, 'Aucune édition de l’Appathon n’est actuellement active.');
    }
    return event;
  }

  /**
   * Récupère un événement public par son slug
   */
  async getPublicBySlug(slug: string): Promise<IEvent> {
    const event = await eventRepository.findBySlug(slug);
    if (!event || event.status === EventStatus.DRAFT) {
      throw AppError.notFound(ErrorCodes.EVENT_NOT_FOUND, 'Événement introuvable.');
    }
    return event;
  }

  /**
   * Configure les critères d'évaluation d'un événement (vérification de la somme à 100)
   */
  async setEvaluationCriteria(
    eventId: string,
    criteria: Array<{ key: string; label: string; maxScore: number; order: number; active?: boolean }>,
    actorId: string
  ): Promise<IEvaluationCriterion[]> {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw AppError.notFound(ErrorCodes.EVENT_NOT_FOUND, 'Événement introuvable.');
    }

    const total = criteria.reduce((sum, c) => sum + c.maxScore, 0);
    if (total !== 100) {
      throw AppError.badRequest(
        ErrorCodes.VALIDATION_ERROR,
        `La somme des scores maximaux des critères doit être exactement égale à 100 points. Actuel : ${total}.`
      );
    }

    const result = await eventRepository.setCriteria(eventId, criteria);

    await auditRepository.log({
      actorId,
      action: AuditAction.EVENT_UPDATED,
      entityType: 'Event',
      entityId: eventId,
      metadata: { criteriaCount: criteria.length, totalScoreSum: total }
    });

    return result;
  }

  /**
   * Publie officiellement les résultats d'un événement
   */
  async publishResults(eventId: string, actorId: string): Promise<IEvent> {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw AppError.notFound(ErrorCodes.EVENT_NOT_FOUND, 'Événement introuvable.');
    }

    event.resultsPublished = true;
    event.status = EventStatus.RESULTS_PUBLISHED;
    await event.save();

    // Rendre publics les lauréats
    await SubmissionModel.updateMany(
      { eventId, status: 'WINNER' },
      { $set: { publicWinner: true } }
    );

    await auditRepository.log({
      actorId,
      action: AuditAction.EVENT_UPDATED,
      entityType: 'Event',
      entityId: eventId,
      metadata: { action: 'PUBLISH_RESULTS' }
    });

    return event;
  }
}

export const eventService = new EventService();
