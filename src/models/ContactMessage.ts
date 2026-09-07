import { Schema, model, Document } from 'mongoose';
import { ContactStatus, ContactType } from '../types/enums';

/**
 * ============================================================================
 * KEVYLAB — MODÈLE MONGODB : MESSAGE DE CONTACT (ContactMessage)
 * ============================================================================
 * Stocke les prises de contact publiques (partenariats, presse, demandes générales)
 * avec typage catégoriel et suivi du statut de réponse.
 * ============================================================================
 */

export interface IContactMessage extends Document {
  name: string;
  email: string;
  subject: string;
  type: ContactType;
  message: string;
  status: ContactStatus;
  adminReplyNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: {
      type: String,
      required: [true, 'Le nom de l’émetteur est obligatoire'],
      trim: true,
      maxlength: [100, 'Le nom ne peut excéder 100 caractères']
    },
    email: {
      type: String,
      required: [true, 'L’adresse courriel est obligatoire'],
      trim: true,
      lowercase: true,
      index: true
    },
    subject: {
      type: String,
      required: [true, 'Le sujet du message est obligatoire'],
      trim: true,
      maxlength: [200, 'Le sujet ne peut excéder 200 caractères']
    },
    type: {
      type: String,
      enum: Object.values(ContactType),
      default: ContactType.GENERAL,
      required: true,
      index: true
    },
    message: {
      type: String,
      required: [true, 'Le corps du message est obligatoire'],
      trim: true,
      maxlength: [5000, 'Le message ne peut excéder 5000 caractères']
    },
    status: {
      type: String,
      enum: Object.values(ContactStatus),
      default: ContactStatus.NEW,
      required: true,
      index: true
    },
    adminReplyNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Les notes de réponse ne peuvent excéder 2000 caractères']
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const ContactMessageModel = model<IContactMessage>('ContactMessage', contactMessageSchema);
