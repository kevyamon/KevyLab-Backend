import { Schema, model, Document } from 'mongoose';
import { AdminRole } from '../types/enums';

/**
 * ============================================================================
 * KEVYLAB — MODÈLE MONGODB : COMPTE ADMINISTRATEUR (AdminUser)
 * ============================================================================
 * Gère les comptes du personnel administratif et des évaluateurs.
 * Les mots de passe sont obligatoirement hachés (aucun mot de passe en clair).
 * ============================================================================
 */

export interface IAdminUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  permissions: string[];
  active: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminUserSchema = new Schema<IAdminUser>(
  {
    firstName: {
      type: String,
      required: [true, 'Le prénom est obligatoire'],
      trim: true,
      maxlength: [50, 'Le prénom ne peut excéder 50 caractères']
    },
    lastName: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
      maxlength: [50, 'Le nom ne peut excéder 50 caractères']
    },
    email: {
      type: String,
      required: [true, 'L’adresse courriel est obligatoire'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Le hachage du mot de passe est obligatoire']
    },
    role: {
      type: String,
      enum: Object.values(AdminRole),
      default: AdminRole.REVIEWER,
      required: true
    },
    permissions: {
      type: [String],
      default: []
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const AdminUserModel = model<IAdminUser>('AdminUser', adminUserSchema);
