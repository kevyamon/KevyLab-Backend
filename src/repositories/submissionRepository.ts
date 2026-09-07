import { FilterQuery } from 'mongoose';
import { SubmissionModel, ISubmission } from '../models/Submission';
import { SubmissionStatus } from '../types/enums';

/**
 * ============================================================================
 * KEVYLAB — DÉPÔT D'ACCÈS AUX DONNÉES : CANDIDATURES (SubmissionRepository)
 * ============================================================================
 * Encapsule les requêtes de persistance, de pagination et de recherche
 * avancée multicritères pour les candidatures des événements.
 * ============================================================================
 */

export interface SubmissionFilters {
  eventId?: string;
  status?: SubmissionStatus;
  country?: string;
  teamType?: 'SOLO' | 'TEAM';
  technicalProfile?: string;
  minScore?: number;
  maxScore?: number;
  search?: string;
}

export class SubmissionRepository {
  /**
   * Crée une nouvelle candidature en base
   */
  async create(data: Partial<ISubmission>): Promise<ISubmission> {
    return SubmissionModel.create(data);
  }

  /**
   * Trouve une candidature par son identifiant unique
   */
  async findById(id: string): Promise<ISubmission | null> {
    return SubmissionModel.findById(id);
  }

  /**
   * Trouve une candidature par sa référence publique (ex. KLA-2026-000001)
   */
  async findByReference(reference: string): Promise<ISubmission | null> {
    return SubmissionModel.findOne({ reference: reference.toUpperCase() });
  }

  /**
   * Vérifie l'existence d'une candidature similaire pour prévenir les doublons
   */
  async checkDuplicate(eventId: string, email: string, projectTitle: string): Promise<boolean> {
    const existing = await SubmissionModel.findOne({
      eventId,
      'candidate.email': email.toLowerCase().trim(),
      'project.title': new RegExp(`^${projectTitle.trim()}$`, 'i')
    });
    return !!existing;
  }

  /**
   * Met à jour le statut d'une candidature
   */
  async updateStatus(id: string, status: SubmissionStatus): Promise<ISubmission | null> {
    return SubmissionModel.findByIdAndUpdate(id, { $set: { status } }, { new: true });
  }

  /**
   * Enregistre l'évaluation interne et le score calculé
   */
  async updateReview(
    id: string,
    scores: Record<string, number>,
    totalScore: number,
    adminNotes?: string,
    reviewedBy?: string
  ): Promise<ISubmission | null> {
    return SubmissionModel.findByIdAndUpdate(
      id,
      {
        $set: {
          'review.scores': scores,
          'review.totalScore': totalScore,
          'review.adminNotes': adminNotes,
          'review.reviewedBy': reviewedBy,
          'review.reviewedAt': new Date()
        }
      },
      { new: true }
    );
  }

  /**
   * Recherche paginée avec filtres et tris pour le Dashboard administrateur
   */
  async findPaginated(
    filters: SubmissionFilters,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: ISubmission[]; total: number; totalPages: number }> {
    const query: FilterQuery<ISubmission> = {};

    if (filters.eventId) query.eventId = filters.eventId;
    if (filters.status) query.status = filters.status;
    if (filters.country) query['candidate.country'] = filters.country;
    if (filters.teamType) query['candidate.teamType'] = filters.teamType;
    if (filters.technicalProfile) query['technicalProfile.level'] = filters.technicalProfile;

    if (filters.minScore !== undefined || filters.maxScore !== undefined) {
      query['review.totalScore'] = {};
      if (filters.minScore !== undefined) query['review.totalScore'].$gte = filters.minScore;
      if (filters.maxScore !== undefined) query['review.totalScore'].$lte = filters.maxScore;
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const skip = (page - 1) * limit;
    const sortOption: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [data, total] = await Promise.all([
      SubmissionModel.find(query).sort(sortOption).skip(skip).limit(limit).lean() as unknown as Promise<ISubmission[]>,
      SubmissionModel.countDocuments(query)
    ]);

    return {
      data,
      total,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  /**
   * Retourne les statistiques globales par statut pour un événement
   */
  async getStatusCounts(eventId?: string): Promise<Record<string, number>> {
    const match = eventId ? { eventId } : {};
    const aggregation = await SubmissionModel.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counts: Record<string, number> = {};
    for (const item of aggregation) {
      counts[item._id] = item.count;
    }
    return counts;
  }

  /**
   * Récupère les lauréats officiels pour restitution publique (sans exposer de données privées)
   */
  async findPublicWinners(eventId: string): Promise<any[]> {
    return SubmissionModel.find(
      { eventId, status: SubmissionStatus.WINNER, publicWinner: true },
      {
        _id: 1,
        reference: 1,
        'candidate.fullName': 1,
        'candidate.country': 1,
        'candidate.teamType': 1,
        'candidate.teamName': 1,
        'project.title': 1,
        'project.tagline': 1,
        'project.solution': 1,
        'project.prototypeUrl': 1,
        'project.githubUrl': 1,
        ranking: 1,
        laureateProfile: 1,
        createdAt: 1
      }
    )
      .sort({ 'laureateProfile.rank': 1, createdAt: 1 })
      .lean();
  }

  /**
   * Met à jour le profil de présentation d'un lauréat (Espace Admin)
   */
  async updateLaureateProfile(
    id: string,
    profile: {
      photoUrl?: string;
      role?: string;
      bio?: string;
      distinction?: string;
      rank?: number;
    }
  ): Promise<ISubmission | null> {
    return SubmissionModel.findByIdAndUpdate(
      id,
      { $set: { laureateProfile: profile } },
      { new: true }
    );
  }
}

export const submissionRepository = new SubmissionRepository();
