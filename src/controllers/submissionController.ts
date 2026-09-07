import { Request, Response, NextFunction } from 'express';
import { submissionService } from '../services/submissionService';
import { scoringService } from '../services/scoringService';
import { submissionRepository } from '../repositories/submissionRepository';
import { emailService } from '../services/emailService';
import { sendSuccess, sendCreated, AppError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types/api';
import { EmailTemplateKey } from '../types/enums';
import { ErrorCodes } from '../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — CONTRÔLEUR HTTP : CANDIDATURES & WORKFLOW DE NOTATION
 * ============================================================================
 * Point d'entrée de soumission publique des projets, consultation paginée,
 * transitions de statut et notation confidentielle côté serveur.
 * ============================================================================
 */

export class SubmissionController {
  /**
   * Soumission publique d'un dossier de candidature (Public)
   */
  async submitApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const result = await submissionService.submitApplication(eventId as string, req.body);
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Consultation paginée des candidatures avec filtres multicritères (Admin)
   */
  async getSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      const filters = {
        eventId: req.query.eventId as string,
        status: req.query.status as any,
        country: req.query.country as string,
        teamType: req.query.teamType as any,
        technicalProfile: req.query.technicalProfile as string,
        minScore: req.query.minScore ? parseFloat(req.query.minScore as string) : undefined,
        maxScore: req.query.maxScore ? parseFloat(req.query.maxScore as string) : undefined,
        search: req.query.search as string
      };

      const result = await submissionRepository.findPaginated(filters, page, limit, sortBy, sortOrder);

      sendSuccess(res, result.data, 200, {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère la fiche détaillée d'une candidature (Admin)
   */
  async getSubmissionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const submission = await submissionRepository.findById(req.params.id as string);
      if (!submission) {
        throw AppError.notFound(ErrorCodes.SUBMISSION_NOT_FOUND, 'Candidature introuvable.');
      }
      sendSuccess(res, submission);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Modifie le statut d'une candidature dans la machine à états (Admin)
   */
  async changeStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, reason, laureateProfile } = req.body;
      const actorId = req.admin?.id || 'admin';

      const updated = await submissionService.changeStatus(id as string, status, actorId, reason, laureateProfile);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Évalue une candidature et calcule le score officiel (Admin)
   */
  async submitReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reviewerId = req.admin?.id || 'admin';

      const updated = await scoringService.submitReview(id as string, req.body, reviewerId);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Envoie un courriel manuel à un candidat depuis sa fiche (Admin)
   */
  async sendManualEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { subject, message } = req.body;

      const submission = await submissionRepository.findById(id as string);
      if (!submission) {
        throw AppError.notFound(ErrorCodes.SUBMISSION_NOT_FOUND, 'Candidature introuvable.');
      }

      emailService.queueEmail({
        recipient: submission.candidate.email,
        templateKey: EmailTemplateKey.ADMIN_MANUAL_EMAIL,
        variables: {
          candidateName: submission.candidate.fullName,
          reference: submission.reference,
          subject,
          message
        },
        relatedEntityType: 'Submission',
        relatedEntityId: submission.id
      });

      sendSuccess(res, { message: 'Courriel mis en file d’envoi avec succès.' });
    } catch (error) {
      next(error);
    }
  }
}

export const submissionController = new SubmissionController();
