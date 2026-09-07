import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/projectService';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types/api';

/**
 * ============================================================================
 * KEVYLAB — CONTRÔLEUR HTTP : PROJETS DU LABORATOIRE
 * ============================================================================
 * Expose les points de terminaison publics pour consulter les réalisations
 * du Lab, et les opérations administratives protégées de gestion de contenu.
 * ============================================================================
 */

export class ProjectController {
  /**
   * Liste tous les projets visibles (Public)
   */
  async getPublicProjects(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projects = await projectService.getPublicProjects();
      sendSuccess(res, projects);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère le détail complet d'un projet par son slug (Public)
   */
  async getPublicProjectBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectService.getPublicBySlug(req.params.slug as string);
      sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crée un nouveau projet (Admin)
   */
  async createProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectService.createProject(req.body, req.admin?.id || 'admin');
      sendCreated(res, project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour un projet existant (Admin)
   */
  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectService.updateProject(req.params.id as string, req.body);
      sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprime un projet du catalogue (Admin)
   */
  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await projectService.deleteProject(req.params.id as string);
      sendSuccess(res, { message: 'Projet supprimé du catalogue avec succès.' });
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
