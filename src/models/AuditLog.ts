import { Schema, model, Document } from 'mongoose';
import { AuditAction } from '../types/enums';

/**
 * ============================================================================
 * KEVYLAB — MODÈLE MONGODB : JOURNAL D'AUDIT (AuditLog)
 * ============================================================================
 * Conserve une trace immuable de chaque action sensible effectuée
 * par les administrateurs (connexions, révisions, changements de statuts).
 * ============================================================================
 */

export interface IAuditLog extends Document {
  actorId: string;
  action: AuditAction | string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: String,
      required: [true, 'L’identifiant de l’auteur de l’action est obligatoire'],
      index: true
    },
    action: {
      type: String,
      required: [true, 'L’action auditée est obligatoire'],
      index: true
    },
    entityType: {
      type: String,
      required: [true, 'Le type d’entité ciblée est obligatoire'],
      index: true
    },
    entityId: {
      type: String,
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

// Index composé pour optimiser les filtres chronologiques par acteur ou entité
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });

export const AuditLogModel = model<IAuditLog>('AuditLog', auditLogSchema);
