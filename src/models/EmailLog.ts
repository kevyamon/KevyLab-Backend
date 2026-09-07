import { Schema, model, Document } from 'mongoose';
import { EmailStatus, EmailTemplateKey } from '../types/enums';

/**
 * ============================================================================
 * KEVYLAB — MODÈLE MONGODB : JOURNAL DES COURRIELS (EmailLog)
 * ============================================================================
 * Consigne l'historique complet de chaque notification transactionnelle émise
 * vers Brevo, permettant la traçabilité et les réessais en cas d'échec.
 * ============================================================================
 */

export interface IEmailLog extends Document {
  recipient: string;
  templateKey: EmailTemplateKey | string;
  provider: 'BREVO';
  relatedEntityType?: string;
  relatedEntityId?: string;
  status: EmailStatus;
  providerMessageId?: string;
  errorCode?: string;
  retryCount: number;
  payloadSnapshot?: Record<string, unknown>;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emailLogSchema = new Schema<IEmailLog>(
  {
    recipient: {
      type: String,
      required: [true, 'Le destinataire du courriel est obligatoire'],
      trim: true,
      lowercase: true,
      index: true
    },
    templateKey: {
      type: String,
      required: [true, 'La clé de modèle de courriel est obligatoire'],
      index: true
    },
    provider: {
      type: String,
      default: 'BREVO',
      required: true
    },
    relatedEntityType: {
      type: String,
      index: true
    },
    relatedEntityId: {
      type: String,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(EmailStatus),
      default: EmailStatus.PENDING,
      required: true,
      index: true
    },
    providerMessageId: {
      type: String,
      trim: true
    },
    errorCode: {
      type: String,
      trim: true
    },
    retryCount: {
      type: Number,
      default: 0
    },
    payloadSnapshot: {
      type: Schema.Types.Mixed,
      default: {}
    },
    sentAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

emailLogSchema.index({ status: 1, retryCount: 1 });

export const EmailLogModel = model<IEmailLog>('EmailLog', emailLogSchema);
