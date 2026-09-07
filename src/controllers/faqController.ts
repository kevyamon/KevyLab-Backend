import { Request, Response, NextFunction } from 'express';
import { faqRepository } from '../repositories/faqRepository';
import { sendSuccess, sendCreated, AppError } from '../utils/apiResponse';
import { ErrorCodes } from '../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — CONTRÔLEUR HTTP : FOIRE AUX QUESTIONS (faqController)
 * ============================================================================
 * Expose la consultation publique des FAQs et les opérations de gestion
 * administrative pour le personnel autorisé.
 * ============================================================================
 */

export class FaqController {
  /**
   * Récupère la FAQ globale du laboratoire (Public)
   */
  async getGlobalFaqs(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await faqRepository.findGlobal();
      sendSuccess(res, items);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère la FAQ spécifique d'un événement / Appathon (Public)
   */
  async getEventFaqs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const items = await faqRepository.findByEvent(eventId as string);
      sendSuccess(res, items);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Liste l'ensemble des éléments de FAQ (Admin)
   */
  async getAllFaqsAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await faqRepository.findAllAdmin();
      sendSuccess(res, items);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crée un nouvel élément de FAQ (Admin)
   */
  async createFaq(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { question, answer, scope, eventId, order, published } = req.body;

      if (!question || !answer) {
        throw AppError.badRequest(
          ErrorCodes.VALIDATION_ERROR,
          'La question et la réponse sont des champs obligatoires.'
        );
      }

      const item = await faqRepository.create({
        question: question.trim(),
        answer: answer.trim(),
        scope: scope === 'EVENT' ? 'EVENT' : 'GLOBAL',
        eventId: scope === 'EVENT' ? eventId : undefined,
        order: typeof order === 'number' ? order : 0,
        published: typeof published === 'boolean' ? published : true
      });

      sendCreated(res, item);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour un élément de FAQ existant (Admin)
   */
  async updateFaq(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await faqRepository.update(id as string, req.body);

      if (!updated) {
        throw AppError.notFound(
          ErrorCodes.NOT_FOUND,
          'Élément de FAQ introuvable.'
        );
      }

      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprime un élément de FAQ (Admin)
   */
  async deleteFaq(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await faqRepository.delete(id as string);

      if (!deleted) {
        throw AppError.notFound(
          ErrorCodes.NOT_FOUND,
          'Élément de FAQ introuvable.'
        );
      }

      sendSuccess(res, { message: 'Élément de FAQ supprimé avec succès.' });
    } catch (error) {
      next(error);
    }
  }
}

export const faqController = new FaqController();
