import { AuditLogModel, IAuditLog } from '../models/AuditLog';
import { AuditAction } from '../types/enums';
import { logger } from '../utils/logger';

/**
 * ============================================================================
 * KEVYLAB — DÉPÔT D'ACCÈS AUX DONNÉES : AUDIT (AuditRepository)
 * ============================================================================
 * Isole les opérations d'insertion et de consultation du journal d'audit.
 * Les erreurs d'audit ne doivent jamais bloquer la transaction principale.
 * ============================================================================
 */

export interface CreateAuditLogDTO {
  actorId: string;
  action: AuditAction | string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export class AuditRepository {
  /**
   * Enregistre une entrée d'audit en base de façon résiliente
   */
  async log(dto: CreateAuditLogDTO): Promise<IAuditLog | null> {
    try {
      const entry = await AuditLogModel.create(dto);
      return entry;
    } catch (error) {
      logger.error('ADMIN', 'Échec non bloquant lors de l’écriture du journal d’audit', error, {
        action: dto.action,
        entityType: dto.entityType
      });
      return null;
    }
  }

  /**
   * Récupère l'historique d'audit pour une entité spécifique
   */
  async findByEntity(entityType: string, entityId: string): Promise<IAuditLog[]> {
    return AuditLogModel.find({ entityType, entityId }).sort({ createdAt: -1 }).lean() as unknown as IAuditLog[];
  }

  /**
   * Récupère les logs récents avec pagination
   */
  async findRecent(limit = 50): Promise<IAuditLog[]> {
    return AuditLogModel.find().sort({ createdAt: -1 }).limit(limit).lean() as unknown as IAuditLog[];
  }
}

export const auditRepository = new AuditRepository();
