import { env } from '../../config/env';
import { logger } from '../../utils/logger';

/**
 * ============================================================================
 * KEVYLAB — CLIENT HTTP BREVO (API REST v3)
 * ============================================================================
 * Assure la communication avec l'API transactionnelle de Brevo.
 * Si aucune clé n'est fournie (ex. : développement local), les courriels sont
 * simulés dans les logs sans bloquer le fonctionnement de la plateforme.
 * ============================================================================
 */

export interface SendEmailPayload {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface BrevoSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class BrevoClient {
  private readonly apiUrl = 'https://api.brevo.com/v3/smtp/email';

  /**
   * Envoie un courriel transactionnel via l'API Brevo
   */
  async sendTransactionalEmail(payload: SendEmailPayload): Promise<BrevoSendResult> {
    const apiKey = env.BREVO_API_KEY;

    // Simulation en environnement local sans clé d'API
    if (!apiKey || apiKey.trim() === '') {
      logger.info('EMAIL', 'Mode simulation actif : envoi Brevo simulé avec succès.', {
        recipient: payload.to[0]?.email,
        subject: payload.subject
      });
      return {
        success: true,
        messageId: `simulated-${Date.now()}`
      };
    }

    try {
      const body = {
        sender: {
          name: env.BREVO_SENDER_NAME,
          email: env.BREVO_SENDER_EMAIL
        },
        to: payload.to,
        subject: payload.subject,
        htmlContent: payload.htmlContent,
        textContent: payload.textContent
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
          accept: 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('EMAIL', 'Échec de l’envoi du courriel par Brevo', errorData, {
          status: response.status
        });
        return {
          success: false,
          error: `Brevo HTTP ${response.status} : ${errorData}`
        };
      }

      const data = (await response.json()) as { messageId?: string };
      return {
        success: true,
        messageId: data.messageId
      };
    } catch (error) {
      logger.error('EMAIL', 'Erreur réseau lors de la communication avec Brevo', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur réseau inconnue'
      };
    }
  }
}

export const brevoClient = new BrevoClient();
