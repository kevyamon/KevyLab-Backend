import { submissionRepository } from '../repositories/submissionRepository';
import { eventRepository } from '../repositories/eventRepository';
import { referenceGenerator } from './referenceGenerator';
import { SubmissionStateMachine } from './submissionStateMachine';
import { emailService } from './emailService';
import { auditRepository } from '../repositories/auditRepository';
import { ISubmission } from '../models/Submission';
import { EventStatus, SubmissionStatus, EmailTemplateKey, AuditAction } from '../types/enums';
import { AppError } from '../utils/apiResponse';
import { ErrorCodes } from '../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — SERVICE MÉTIER : CANDIDATURES & WORKFLOW ÉVÉNEMENTIEL
 * ============================================================================
 * Orchestre la validation des candidatures, le contrôle des doublons, la
 * génération de références, les transitions d'état et les notifications Brevo.
 * ============================================================================
 */

export class SubmissionService {
  /**
   * Crée et enregistre une nouvelle candidature avec notification par courriel
   */
  async submitApplication(eventId: string, payload: Partial<ISubmission>): Promise<{ reference: string; status: SubmissionStatus }> {
    // 1. Contrôle de l'événement et de son statut d'ouverture
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw AppError.notFound(ErrorCodes.EVENT_NOT_FOUND, 'L’événement spécifié est introuvable.');
    }

    if (event.status !== EventStatus.APPLICATIONS_OPEN) {
      throw AppError.badRequest(
        ErrorCodes.APPLICATIONS_CLOSED,
        'Les candidatures à cette initiative sont actuellement closes ou non encore ouvertes.'
      );
    }

    if (!payload.candidate || !payload.project) {
      throw AppError.badRequest(
        ErrorCodes.VALIDATION_ERROR,
        'Les données du candidat et du projet sont obligatoires.'
      );
    }

    // 2. Déduplication anti-collision
    const isDuplicate = await submissionRepository.checkDuplicate(
      eventId,
      payload.candidate.email,
      payload.project.title
    );

    if (isDuplicate) {
      throw AppError.conflict(
        ErrorCodes.SUBMISSION_DUPLICATE,
        'Un projet avec cet intitulé a déjà été déposé avec cette adresse courriel pour cet événement.'
      );
    }

    // 3. Génération atomique de la référence (KLA-2026-000001)
    const reference = await referenceGenerator.generateReference(event.edition || '2026');

    // 4. Persistance en base de données
    const submission = await submissionRepository.create({
      ...payload,
      eventId,
      reference,
      status: SubmissionStatus.PENDING,
      publicWinner: false
    });

    // 5. Envoi asynchrone découplé du courriel de confirmation
    emailService.queueEmail({
      recipient: submission.candidate.email,
      templateKey: EmailTemplateKey.SUBMISSION_CREATED,
      variables: {
        candidateName: submission.candidate.fullName,
        projectTitle: submission.project.title,
        reference: submission.reference
      },
      relatedEntityType: 'Submission',
      relatedEntityId: submission.id
    });

    return {
      reference: submission.reference,
      status: submission.status
    };
  }

  /**
   * Modifie le statut d'une candidature avec validation de transition et audit
   */
  async changeStatus(
    submissionId: string,
    newStatus: SubmissionStatus,
    actorId: string,
    reason?: string
  ): Promise<ISubmission> {
    const submission = await submissionRepository.findById(submissionId);
    if (!submission) {
      throw AppError.notFound(ErrorCodes.SUBMISSION_NOT_FOUND, 'Candidature introuvable.');
    }

    // Validation par la machine à états
    SubmissionStateMachine.validateTransition(submission.status, newStatus);

    const oldStatus = submission.status;
    submission.status = newStatus;
    await submission.save();

    // Journalisation d'audit
    await auditRepository.log({
      actorId,
      action: AuditAction.SUBMISSION_STATUS_CHANGED,
      entityType: 'Submission',
      entityId: submission.id,
      metadata: { oldStatus, newStatus, reason }
    });

    // Déclenchement conditionnel d'emails de notification selon le nouveau statut
    if (newStatus === SubmissionStatus.SHORTLISTED) {
      emailService.queueEmail({
        recipient: submission.candidate.email,
        templateKey: EmailTemplateKey.SUBMISSION_SHORTLISTED,
        variables: {
          candidateName: submission.candidate.fullName,
          projectTitle: submission.project.title,
          reference: submission.reference
        },
        relatedEntityType: 'Submission',
        relatedEntityId: submission.id
      });
    } else if (newStatus === SubmissionStatus.ACCEPTED) {
      emailService.queueEmail({
        recipient: submission.candidate.email,
        templateKey: EmailTemplateKey.SUBMISSION_ACCEPTED,
        variables: {
          candidateName: submission.candidate.fullName,
          projectTitle: submission.project.title,
          reference: submission.reference
        },
        relatedEntityType: 'Submission',
        relatedEntityId: submission.id
      });
    } else if (newStatus === SubmissionStatus.REJECTED) {
      emailService.queueEmail({
        recipient: submission.candidate.email,
        templateKey: EmailTemplateKey.SUBMISSION_REJECTED,
        variables: {
          candidateName: submission.candidate.fullName,
          projectTitle: submission.project.title,
          reference: submission.reference
        },
        relatedEntityType: 'Submission',
        relatedEntityId: submission.id
      });
    }

    return submission;
  }
}

export const submissionService = new SubmissionService();
