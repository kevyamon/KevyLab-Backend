import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
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

const DEFAULT_STAFF_PERMISSIONS = [
  'submissions.read',
  'submissions.review',
  'submissions.change_status',
  'events.manage',
  'projects.manage',
  'emails.send',
  'contacts.read'
];

const buildAuthPayload = (admin: IAdminUser) => {
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
};

export class AuthService {
  /**
   * Enregistre un nouveau compte administrateur en validant obligatoirement la clé maître ADMIN_PW
   */
  async register(dto: RegisterAdminDTO, ipAddress?: string): Promise<{ user: Partial<IAdminUser>; accessToken: string; refreshToken: string }> {
    if (!dto.adminPw || dto.adminPw !== env.ADMIN_PW) {
      throw AppError.badRequest(
        ErrorCodes.INVALID_ADMIN_SECRET,
        'La clé secrète d’inscription administrative fournie est incorrecte.'
      );
    }

    const existing = await AdminUserModel.findOne({ email: dto.email.toLowerCase().trim() });
    if (existing) {
      throw AppError.conflict(
        ErrorCodes.VALIDATION_ERROR,
        'Un compte associé à cette adresse courriel existe déjà.'
      );
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);
    const role = dto.role || AdminRole.ADMIN;
    const permissions = role === AdminRole.SUPER_ADMIN ? ['*'] : DEFAULT_STAFF_PERMISSIONS;

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

    await auditRepository.log({
      actorId: admin.id,
      action: AuditAction.ADMIN_CREATED,
      entityType: 'AdminUser',
      entityId: admin.id,
      metadata: { email: admin.email, role: admin.role },
      ipAddress
    });

    return buildAuthPayload(admin);
  }

  /**
   * Connecte un administrateur existant
   */
  async login(email: string, password: string, ipAddress?: string): Promise<{ user: Partial<IAdminUser>; accessToken: string; refreshToken: string }> {
    const admin = await AdminUserModel.findOne({ email: email.toLowerCase().trim() });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw AppError.unauthorized('Identifiants d’accès invalides.');
    }

    if (!admin.active) {
      throw AppError.forbidden('Ce compte administrateur a été désactivé.');
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

    return buildAuthPayload(admin);
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

  /**
   * Authentification administrative via jeton d'identité Google OAuth 2.0
   */
  async loginWithGoogle(idToken: string, adminPw?: string, ipAddress?: string): Promise<{ user: Partial<IAdminUser>; accessToken: string; refreshToken: string }> {
    if (!idToken || typeof idToken !== 'string') {
      throw AppError.badRequest(
        ErrorCodes.VALIDATION_ERROR,
        'Le jeton d’identité Google (idToken) est obligatoire.'
      );
    }

    let email = '';
    let firstName = 'Membre';
    let lastName = 'Staff';

    // Vérification cryptographique du jeton Google
    if (env.GOOGLE_CLIENT_ID) {
      try {
        const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken,
          audience: env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          throw AppError.unauthorized('Jeton d’identité Google invalide ou sans adresse email.');
        }
        email = payload.email.toLowerCase().trim();
        firstName = payload.given_name || firstName;
        lastName = payload.family_name || lastName;
      } catch (err: any) {
        if (err instanceof AppError) throw err;
        throw AppError.unauthorized('Échec de la validation cryptographique du jeton Google.');
      }
    } else {
      // Mode secours / simulation pour tests
      try {
        const parts = idToken.split('.');
        const payloadPart = parts[1];
        if (parts.length === 3 && payloadPart) {
          const payload = JSON.parse(Buffer.from(payloadPart, 'base64').toString('utf-8'));
          email = (payload.email || '').toLowerCase().trim();
          firstName = payload.given_name || payload.name || firstName;
          lastName = payload.family_name || lastName;
        }
      } catch {
        // payload non décodable
      }
      if (!email) {
        throw AppError.badRequest(
          ErrorCodes.VALIDATION_ERROR,
          'Configuration GOOGLE_CLIENT_ID requise ou jeton Google invalide.'
        );
      }
    }

    // Recherche du compte administrateur correspondant
    let admin = await AdminUserModel.findOne({ email });

    if (!admin) {
      if (!adminPw || adminPw !== env.ADMIN_PW) {
        throw AppError.unauthorized(
          'Aucun compte administrateur n’est associé à cette adresse Google. Pour enregistrer ce compte, fournissez la clé secrète administrative.'
        );
      }

      const randomSecret = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(randomSecret, salt);

      admin = await AdminUserModel.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email,
        passwordHash,
        role: AdminRole.ADMIN,
        permissions: [
          'submissions.read',
          'submissions.review',
          'submissions.change_status',
          'events.manage',
          'projects.manage',
          'emails.send',
          'contacts.read'
        ],
        active: true,
        lastLoginAt: new Date()
      });

      await auditRepository.log({
        actorId: admin.id,
        action: AuditAction.ADMIN_CREATED,
        entityType: 'AdminUser',
        entityId: admin.id,
        metadata: { email: admin.email, provider: 'GOOGLE' },
        ipAddress
      });
    } else {
      if (!admin.active) {
        throw AppError.forbidden('Ce compte administrateur a été désactivé.');
      }

      admin.lastLoginAt = new Date();
      await admin.save();

      await auditRepository.log({
        actorId: admin.id,
        action: AuditAction.ADMIN_LOGIN,
        entityType: 'AdminUser',
        entityId: admin.id,
        metadata: { provider: 'GOOGLE' },
        ipAddress
      });
    }

    return buildAuthPayload(admin);
  }
}

export const authService = new AuthService();
