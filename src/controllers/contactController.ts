import { Request, Response, NextFunction } from 'express';
import { ContactMessageModel } from '../models/ContactMessage';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AppError } from '../utils/apiResponse';
import { ErrorCodes } from '../constants/errorCodes';
import { ContactStatus } from '../types/enums';

/**
 * ============================================================================
 * KEVYLAB — CONTRÔLEUR HTTP : MESSAGERIE DE CONTACT
 * ============================================================================
 * Permet aux visiteurs et partenaires de soumettre un message public,
 * et aux administrateurs de consulter et annoter les demandes reçues.
 * ============================================================================
 */

export class ContactController {
  /**
   * Enregistre un nouveau message de contact (Public)
   */
  async submitContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, subject, type, message } = req.body;

      const contact = await ContactMessageModel.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        subject: subject.trim(),
        type,
        message: message.trim(),
        status: ContactStatus.NEW
      });

      sendCreated(res, {
        id: contact.id,
        message: 'Votre message a bien été transmis à l’équipe KevyLab. Nous vous répondrons dans les meilleurs délais.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Liste les messages reçus avec pagination (Admin)
   */
  async getContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        ContactMessageModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ContactMessageModel.countDocuments()
      ]);

      sendSuccess(res, data, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour le statut et les notes d'un message de contact (Admin)
   */
  async updateContactStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, adminReplyNotes } = req.body;

      const updated = await ContactMessageModel.findByIdAndUpdate(
        id,
        { $set: { status, adminReplyNotes } },
        { new: true }
      );

      if (!updated) {
        throw AppError.notFound(ErrorCodes.NOT_FOUND, 'Message de contact introuvable.');
      }

      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }
}

export const contactController = new ContactController();
