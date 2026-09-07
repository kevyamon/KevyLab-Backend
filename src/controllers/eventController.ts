import { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/eventService';
import { eventRepository } from '../repositories/eventRepository';
import { submissionRepository } from '../repositories/submissionRepository';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types/api';

/**
 * ============================================================================
 * KEVYLAB — CONTRÔLEUR HTTP : ÉVÉNEMENTS & CONCOURS
 * ============================================================================
 * Gère l'accès public aux événements (dont l'Appathon actif), la configuration
 * des critères d'évaluation et le déclenchement de la publication des lauréats.
 * ============================================================================
 */

export class EventController {
  /**
   * Récupère l'Appathon actuellement actif (Public)
   */
  async getActiveAppathon(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await eventService.getActiveAppathon();
      sendSuccess(res, event);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Liste tous les événements publics (Public)
   */
  async getPublicEvents(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await eventRepository.findAllPublic();
      sendSuccess(res, events);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère un événement public par son slug (Public)
   */
  async getPublicEventBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await eventService.getPublicBySlug(req.params.slug as string);
      sendSuccess(res, event);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les lauréats officiels publiés d'un événement (Public)
   */
  async getEventWinners(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const winners = await submissionRepository.findPublicWinners(eventId as string);
      sendSuccess(res, winners);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crée un nouvel événement (Admin)
   */
  async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await eventRepository.create(req.body);
      sendCreated(res, event);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour un événement existant (Admin)
   */
  async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await eventRepository.update(req.params.id as string, req.body);
      sendSuccess(res, event);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les critères d'évaluation d'un événement
   */
  async getCriteria(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const criteria = await eventRepository.getCriteriaByEvent(req.params.eventId as string);
      sendSuccess(res, criteria);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enregistre les critères d'évaluation d'un événement (Admin)
   */
  async setCriteria(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const criteria = await eventService.setEvaluationCriteria(
        req.params.eventId as string,
        req.body.criteria,
        req.admin?.id || 'admin'
      );
      sendSuccess(res, criteria);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Publie officiellement les résultats du concours (Admin)
   */
  async publishResults(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await eventService.publishResults(req.params.id as string, req.admin?.id || 'admin');
      sendSuccess(res, event);
    } catch (error) {
      next(error);
    }
  }
}

export const eventController = new EventController();
