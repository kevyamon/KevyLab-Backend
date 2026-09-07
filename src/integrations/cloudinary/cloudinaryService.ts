import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/apiResponse';
import { ErrorCodes } from '../../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — SERVICE DE GESTION MÉDIA CLOUDINARY (cloudinaryService)
 * ============================================================================
 * Centralise l'hébergement, la compression et l'optimisation des visuels :
 * photos des lauréats, logos et bannières de projets, affiches de concours.
 * ============================================================================
 */

export type MediaFolder = 'laureates' | 'projects' | 'events' | 'submissions' | 'general';

export interface UploadResult {
  secureUrl: string;
  publicId: string;
  format?: string;
  bytes?: number;
}

export class CloudinaryService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = Boolean(
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
    );

    if (this.isConfigured) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
        secure: true
      });
      logger.info('SYSTEM', 'Service Cloudinary initialisé avec succès.');
    } else {
      logger.warn('SYSTEM', 'Cloudinary non configuré : mode simulation / local actif.');
    }
  }

  /**
   * Téléverse une image (Base64 Data URI ou URL) sur Cloudinary
   */
  async uploadImage(dataUriOrUrl: string, folder: MediaFolder = 'general'): Promise<UploadResult> {
    if (!dataUriOrUrl || typeof dataUriOrUrl !== 'string') {
      throw AppError.badRequest(
        ErrorCodes.VALIDATION_ERROR,
        'La charge utile de l’image est obligatoire.'
      );
    }

    // Mode simulation locale si aucune clé API n'est renseignée
    if (!this.isConfigured) {
      logger.info('SYSTEM', `[Simulation] Téléversement d'image dans kevylab/${folder}`);
      return {
        secureUrl: dataUriOrUrl.startsWith('data:image') ? dataUriOrUrl : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
        publicId: `simulated-${Date.now()}`
      };
    }

    try {
      const uploadResponse = await cloudinary.uploader.upload(dataUriOrUrl, {
        folder: `kevylab/${folder}`,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      return {
        secureUrl: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        format: uploadResponse.format,
        bytes: uploadResponse.bytes
      };
    } catch (error) {
      logger.error('SYSTEM', 'Échec du téléversement vers Cloudinary', error);
      throw AppError.internal(
        ErrorCodes.INTERNAL_ERROR,
        'Une erreur est survenue lors de l’hébergement de l’image.'
      );
    }
  }

  /**
   * Supprime un média par son identifiant public
   */
  async deleteImage(publicId: string): Promise<boolean> {
    if (!this.isConfigured) return true;

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      logger.error('SYSTEM', `Échec de la suppression Cloudinary pour ${publicId}`, error);
      return false;
    }
  }
}

export const cloudinaryService = new CloudinaryService();
