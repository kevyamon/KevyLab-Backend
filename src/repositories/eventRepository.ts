import { EventModel, IEvent } from '../models/Event';
import { EvaluationCriterionModel, IEvaluationCriterion } from '../models/EvaluationCriterion';
import { EventStatus, EventType } from '../types/enums';

/**
 * ============================================================================
 * KEVYLAB — DÉPÔT D'ACCÈS AUX DONNÉES : ÉVÉNEMENTS & CRITÈRES
 * ============================================================================
 * Centralise les requêtes de recherche, mise à jour et configuration
 * des événements et de leurs critères de notation associés.
 * ============================================================================
 */

export class EventRepository {
  /**
   * Recherche un événement par son identifiant MongoDB
   */
  async findById(id: string): Promise<IEvent | null> {
    return EventModel.findById(id);
  }

  /**
   * Recherche un événement par son slug d'URL
   */
  async findBySlug(slug: string): Promise<IEvent | null> {
    return EventModel.findOne({ slug });
  }

  /**
   * Récupère le premier événement actif de type Appathon
   */
  async findActiveAppathon(): Promise<IEvent | null> {
    return EventModel.findOne({
      type: EventType.APPATHON,
      status: {
        $in: [
          EventStatus.APPLICATIONS_OPEN,
          EventStatus.ANNOUNCED,
          EventStatus.UNDER_REVIEW,
          EventStatus.RESULTS_PUBLISHED
        ]
      }
    }).sort({ createdAt: -1 });
  }

  /**
   * Liste l'ensemble des événements publics
   */
  async findAllPublic(): Promise<IEvent[]> {
    return EventModel.find({
      status: { $ne: EventStatus.DRAFT }
    }).sort({ createdAt: -1 });
  }

  /**
   * Crée un nouvel événement
   */
  async create(data: Partial<IEvent>): Promise<IEvent> {
    return EventModel.create(data);
  }

  /**
   * Met à jour un événement existant
   */
  async update(id: string, data: Partial<IEvent>): Promise<IEvent | null> {
    return EventModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  /**
   * Récupère les critères actifs d'un événement
   */
  async getCriteriaByEvent(eventId: string): Promise<IEvaluationCriterion[]> {
    return EvaluationCriterionModel.find({ eventId, active: true }).sort({ order: 1 });
  }

  /**
   * Définit ou remplace l'ensemble des critères d'un événement
   */
  async setCriteria(
    eventId: string,
    criteria: Array<{ key: string; label: string; maxScore: number; order: number; active?: boolean }>
  ): Promise<IEvaluationCriterion[]> {
    // Désactiver ou remplacer les anciens critères
    await EvaluationCriterionModel.deleteMany({ eventId });
    const docs = criteria.map((c) => ({
      ...c,
      active: c.active ?? true,
      eventId
    }));
    return (await EvaluationCriterionModel.insertMany(docs)) as unknown as IEvaluationCriterion[];
  }
}

export const eventRepository = new EventRepository();
