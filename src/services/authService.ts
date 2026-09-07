import bcrypt from 'bcryptjs';
import { AdminUserModel, IAdminUser } from '../models/AdminUser';
import { AdminRole, AuditAction } from '../types/enums';
import { AdminTokenPayload } from '../types/api';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/apiResponse';
import { ErrorCodes } from '../constants/errorCodes';
import { env } from '../config/env';
import { auditRepository } from '../repositories/auditRepository';

/**
 * ============================================================================
 * KEVYLAB — SERVICE D'AUTHENTIFICATION ADMINISTRATIVE & GESTION DU PERSONNEL
 * ============================================================================
 * Implémente la logique métier d'inscription furtive sécurisée par "ADMIN_PW",
 * de connexion avec hachage Bcrypt et d'émission des jetons d'accès.
 * ============================================================================
 */

export interface RegisterAdminDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  adminPw: string;
  role?: AdminRole;
}

export class AuthService {
  /**
   * Enregistre un nouveau compte administrateur en validant obligatoirement la clé maître ADMIN_PW
   */
  async register(dto: RegisterAdminDTO, ipAddress?: string): Promise<{ user: Partial<IAdminUser>; accessToken: string; refreshToken: string }> {
    // 1. Validation de la clé secrète d'inscription sur Render
    if (!dto.adminPw || dto.adminPw !== env.ADMIN_PW) {
      throw AppError.badRequest(
        ErrorCodes.INVALID_ADMIN_SECRET,
        'La clé secrète d’inscription administrative fournie est incorrecte.'
      );
    }

    // 2. Vérification de l'unicité de l'adresse courriel
    const existing = await AdminUserModel.findOne({ email: dto.email.toLowerCase().trim() });
    if (existing) {
      throw AppError.conflict(
        ErrorCodes.VALIDATION_ERROR,
        'Un compte associé à cette adresse courriel existe déjà.'
      );
    }

    // 3. Hachage sécurisé du mot de passe (coût 12)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // 4. Définition des permissions initiales
    const role = dto.role || AdminRole.ADMIN;
    const permissions = role === AdminRole.SUPER_ADMIN
      ? ['*']
      : [
          'submissions.read',
          'submissions.review',
          'submissions.change_status',
          'events.manage',
          'projects.manage',
          'emails.send',
          'contacts.read'
        ];

    const admin = await AdminUserModel.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      role,
      permissions,
      active: true,
      lastLoginAt: new Date()
    });

    // 5. Journalisation d'audit immuable
    await auditRepository.log({
      actorId: admin.id,
      action: AuditAction.ADMIN_CREATED,
      entityType: 'AdminUser',
      entityId: admin.id,
      metadata: { email: admin.email, role: admin.role },
      ipAddress
    });

    const tokenPayload: AdminTokenPayload = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return {
      user: {
        id: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Connecte un administrateur existant
   */
  async login(email: string, password: string, ipAddress?: string): Promise<{ user: Partial<IAdminUser>; accessToken: string; refreshToken: string }> {
    const admin = await AdminUserModel.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      throw AppError.unauthorized('Identifiants d’accès invalides.');
    }

    if (!admin.active) {
      throw AppError.forbidden('Ce compte administrateur a été désactivé.');
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized('Identifiants d’accès invalides.');
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    await auditRepository.log({
      actorId: admin.id,
      action: AuditAction.ADMIN_LOGIN,
      entityType: 'AdminUser',
      entityId: admin.id,
      ipAddress
    });

    const tokenPayload: AdminTokenPayload = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions
    };

    return {
      user: {
        id: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      },
      accessToken: signAccessToken(tokenPayload),
      refreshToken: signRefreshToken(tokenPayload)
    };
  }

  /**
   * Rafraîchit le jeton d'accès via le Refresh Token
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const admin = await AdminUserModel.findById(decoded.id);

      if (!admin || !admin.active) {
        throw AppError.unauthorized('Session expirée ou compte inactif.');
      }

      const tokenPayload: AdminTokenPayload = {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      };

      return {
        accessToken: signAccessToken(tokenPayload)
      };
    } catch {
      throw AppError.unauthorized('Jeton de rafraîchissement invalide ou expiré.');
    }
  }
}

export const authService = new AuthService();
