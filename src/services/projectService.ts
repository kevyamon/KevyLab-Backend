import { LabProjectModel, ILabProject } from '../models/LabProject';
import { auditRepository } from '../repositories/auditRepository';
import { AuditAction, ProjectStatus } from '../types/enums';
import { AppError } from '../utils/apiResponse';
import { ErrorCodes } from '../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — SERVICE MÉTIER : PORTFOLIO DES PROJETS DU LABORATOIRE
 * ============================================================================
 * Gère le catalogue officiel des projets technologiques, prototypes et R&D,
 * garantissant la séparation étanche avec les événements.
 * ============================================================================
 */

export class ProjectService {
  /**
   * Liste les projets visibles publiquement
   */
  async getPublicProjects(): Promise<ILabProject[]> {
    return LabProjectModel.find({
      status: { $ne: ProjectStatus.ARCHIVED }
    })
      .sort({ featured: -1, createdAt: -1 })
      .lean() as unknown as ILabProject[];
  }

  /**
   * Récupère un projet public par son slug
   */
  async getPublicBySlug(slug: string): Promise<ILabProject> {
    const project = await LabProjectModel.findOne({ slug });
    if (!project || project.status === ProjectStatus.ARCHIVED) {
      throw AppError.notFound(ErrorCodes.NOT_FOUND, 'Projet introuvable dans le catalogue.');
    }
    return project;
  }

  /**
   * Crée un nouveau projet (Espace Admin)
   */
  async createProject(data: Partial<ILabProject>, actorId: string): Promise<ILabProject> {
    const existing = await LabProjectModel.findOne({ slug: data.slug });
    if (existing) {
      throw AppError.conflict(ErrorCodes.VALIDATION_ERROR, 'Un projet avec ce slug existe déjà.');
    }

    const project = await LabProjectModel.create(data);

    await auditRepository.log({
      actorId,
      action: AuditAction.PROJECT_PUBLISHED,
      entityType: 'LabProject',
      entityId: project.id,
      metadata: { name: project.name, slug: project.slug }
    });

    return project;
  }

  /**
   * Met à jour un projet existant
   */
  async updateProject(id: string, data: Partial<ILabProject>): Promise<ILabProject> {
    const project = await LabProjectModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!project) {
      throw AppError.notFound(ErrorCodes.NOT_FOUND, 'Projet introuvable.');
    }

    return project;
  }

  /**
   * Supprime un projet
   */
  async deleteProject(id: string): Promise<void> {
    const res = await LabProjectModel.findByIdAndDelete(id);
    if (!res) {
      throw AppError.notFound(ErrorCodes.NOT_FOUND, 'Projet introuvable.');
    }
  }
}

export const projectService = new ProjectService();
