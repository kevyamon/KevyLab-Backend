import { EmailLogModel, IEmailLog } from '../models/EmailLog';
import { EmailStatus, EmailTemplateKey } from '../types/enums';
import { brevoClient } from '../integrations/brevo/brevoClient';
import { renderEmailTemplate } from '../integrations/brevo/emailTemplates';
import { logger } from '../utils/logger';
import { AppError } from '../utils/apiResponse';
import { ErrorCodes } from '../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — SERVICE DE MESSAGERIE TRANSACTIONNELLE ASYNCHRONE
 * ============================================================================
 * Encapsule Brevo, journalise chaque envoi dans EmailLog et assure qu'aucun
 * échec de délivrance ne compromet l'intégrité des transactions métier.
 * ============================================================================
 */

export interface QueueEmailOptions {
  recipient: string;
  templateKey: EmailTemplateKey | string;
  variables: Record<string, string>;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export class EmailService {
  private readonly MAX_RETRIES = 5;

  /**
   * File d'attente asynchrone pour l'émission d'un courriel (Non bloquant)
   */
  queueEmail(options: QueueEmailOptions): void {
    // Exécution détachée du cycle de requête HTTP
    setImmediate(async () => {
      await this.processEmail(options);
    });
  }

  /**
   * Traite l'envoi effectif et journalise le statut
   */
  private async processEmail(options: QueueEmailOptions): Promise<IEmailLog> {
    const rendered = renderEmailTemplate(options.templateKey, options.variables);

    // 1. Création de l'entrée initiale en base (statut PENDING)
    const logEntry = await EmailLogModel.create({
      recipient: options.recipient.toLowerCase().trim(),
      templateKey: options.templateKey,
      provider: 'BREVO',
      relatedEntityType: options.relatedEntityType,
      relatedEntityId: options.relatedEntityId,
      status: EmailStatus.PENDING,
      payloadSnapshot: options.variables,
      retryCount: 0
    });

    // 2. Appel au client Brevo
    const result = await brevoClient.sendTransactionalEmail({
      to: [{ email: options.recipient }],
      subject: rendered.subject,
      htmlContent: rendered.html
    });

    // 3. Mise à jour de l'historique
    if (result.success) {
      logEntry.status = EmailStatus.SENT;
      logEntry.providerMessageId = result.messageId;
      logEntry.sentAt = new Date();
      await logEntry.save();

      logger.info('EMAIL', `Courriel transmis avec succès à ${options.recipient}`, {
        logId: logEntry.id,
        templateKey: options.templateKey
      });
    } else {
      logEntry.status = EmailStatus.FAILED;
      logEntry.errorCode = result.error;
      await logEntry.save();

      logger.warn('EMAIL', `Échec d’envoi du courriel à ${options.recipient} : ${result.error}`, {
        logId: logEntry.id,
        templateKey: options.templateKey
      });
    }

    return logEntry;
  }

  /**
   * Réessaie manuellement un courriel échoué depuis le Dashboard administrateur
   */
  async retryEmail(emailLogId: string): Promise<IEmailLog> {
    const logEntry = await EmailLogModel.findById(emailLogId);
    if (!logEntry) {
      throw AppError.notFound(ErrorCodes.EMAIL_LOG_NOT_FOUND, 'Journal de courriel introuvable.');
    }

    if (logEntry.retryCount >= this.MAX_RETRIES) {
      throw AppError.badRequest(
        ErrorCodes.VALIDATION_ERROR,
        `Ce courriel a atteint la limite maximale de ${this.MAX_RETRIES} tentatives.`
      );
    }

    const variables = (logEntry.payloadSnapshot as Record<string, string>) || {};
    const rendered = renderEmailTemplate(logEntry.templateKey, variables);

    logEntry.retryCount += 1;

    const result = await brevoClient.sendTransactionalEmail({
      to: [{ email: logEntry.recipient }],
      subject: rendered.subject,
      htmlContent: rendered.html
    });

    if (result.success) {
      logEntry.status = EmailStatus.SENT;
      logEntry.providerMessageId = result.messageId;
      logEntry.sentAt = new Date();
      logEntry.errorCode = undefined;
    } else {
      logEntry.status = EmailStatus.FAILED;
      logEntry.errorCode = result.error;
    }

    await logEntry.save();
    return logEntry;
  }
}

export const emailService = new EmailService();
