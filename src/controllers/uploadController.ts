import { Request, Response, NextFunction } from 'express';
import { cloudinaryService, MediaFolder } from '../integrations/cloudinary/cloudinaryService';
import { sendSuccess, AppError } from '../utils/apiResponse';
import { ErrorCodes } from '../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — CONTRÔLEUR HTTP : GESTION DES TÉLÉVERSEMENTS MÉDIA (Cloudinary)
 * ============================================================================
 * Réceptionne les fichiers et visuels (Base64 ou URL), valide leur structure
 * et les expédie vers le stockage Cloudinary optimisé (WebP/Auto-compression).
 * ============================================================================
 */

export class UploadController {
  /**
   * Téléverse une image vers un dossier Cloudinary ciblé
   * Payload attendu : { image: string (Data URI Base64 ou URL), folder?: MediaFolder }
   */
  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { image, folder } = req.body;

      if (!image || typeof image !== 'string') {
        throw AppError.badRequest(
          ErrorCodes.VALIDATION_ERROR,
          'Le champ "image" est obligatoire et doit contenir une chaîne Base64 ou une URL valide.'
        );
      }

      // Validation stricte du dossier cible
      const validFolders: MediaFolder[] = ['laureates', 'projects', 'events', 'submissions', 'general'];
      const targetFolder: MediaFolder = validFolders.includes(folder) ? folder : 'general';

      // Téléversement via le service Cloudinary
      const result = await cloudinaryService.uploadImage(image, targetFolder);

      sendSuccess(res, {
        url: result.secureUrl,
        publicId: result.publicId,
        format: result.format,
        bytes: result.bytes
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprime une ressource média par son identifiant public Cloudinary
   */
  async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { publicId } = req.body;

      if (!publicId || typeof publicId !== 'string') {
        throw AppError.badRequest(
          ErrorCodes.VALIDATION_ERROR,
          'L’identifiant "publicId" du média à supprimer est obligatoire.'
        );
      }

      const deleted = await cloudinaryService.deleteImage(publicId);
      sendSuccess(res, { deleted, publicId });
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
