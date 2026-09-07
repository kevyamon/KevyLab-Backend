import { Request, Response, NextFunction } from 'express';
import { SubmissionModel } from '../models/Submission';
import { EventModel } from '../models/Event';
import { LabProjectModel } from '../models/LabProject';
import { ContactMessageModel } from '../models/ContactMessage';
import { EmailLogModel } from '../models/EmailLog';
import { sendSuccess } from '../utils/apiResponse';
import { SubmissionStatus, ContactStatus, EmailStatus } from '../types/enums';

/**
 * ============================================================================
 * KEVYLAB — CONTRÔLEUR HTTP : DASHBOARD ADMINISTRATEUR & MÉTRIQUES
 * ============================================================================
 * Compile en temps réel les indicateurs clés de performance (KPIs)
 * de l'Appathon actif et de l'ensemble de la plateforme KevyLab.
 * ============================================================================
 */

export class AdminDashboardController {
  /**
   * Agrège et renvoie les statistiques du Dashboard
   */
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        totalSubmissions,
        pendingSubmissions,
        reviewingSubmissions,
        shortlistedSubmissions,
        acceptedSubmissions,
        rejectedSubmissions,
        winnersSubmissions,
        eventsCount,
        projectsCount,
        unreadContactsCount,
        failedEmailsCount,
        recentSubmissions
      ] = await Promise.all([
        SubmissionModel.countDocuments(),
        SubmissionModel.countDocuments({ status: SubmissionStatus.PENDING }),
        SubmissionModel.countDocuments({ status: SubmissionStatus.UNDER_REVIEW }),
        SubmissionModel.countDocuments({ status: SubmissionStatus.SHORTLISTED }),
        SubmissionModel.countDocuments({ status: SubmissionStatus.ACCEPTED }),
        SubmissionModel.countDocuments({ status: SubmissionStatus.REJECTED }),
        SubmissionModel.countDocuments({ status: SubmissionStatus.WINNER }),
        EventModel.countDocuments(),
        LabProjectModel.countDocuments(),
        ContactMessageModel.countDocuments({ status: ContactStatus.NEW }),
        EmailLogModel.countDocuments({ status: EmailStatus.FAILED }),
        SubmissionModel.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('reference candidate.fullName project.title status review.totalScore createdAt')
          .lean()
      ]);

      sendSuccess(res, {
        submissions: {
          total: totalSubmissions,
          pending: pendingSubmissions,
          reviewing: reviewingSubmissions,
          shortlisted: shortlistedSubmissions,
          accepted: acceptedSubmissions,
          rejected: rejectedSubmissions,
          winners: winnersSubmissions
        },
        events: eventsCount,
        projects: projectsCount,
        unreadContacts: unreadContactsCount,
        failedEmails: failedEmailsCount,
        recentSubmissions
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminDashboardController = new AdminDashboardController();

