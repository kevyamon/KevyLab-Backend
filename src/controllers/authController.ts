import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types/api';
import { env } from '../config/env';

/**
 * ============================================================================
 * KEVYLAB — CONTRÔLEUR HTTP : AUTHENTIFICATION ADMINISTRATIVE
 * ============================================================================
 * Gère l'inscription furtive sécurisée par "ADMIN_PW", la connexion,
 * le rafraîchissement des jetons et la déconnexion par cookies HttpOnly.
 * ============================================================================
 */

export class AuthController {
  /**
   * Inscription d'un administrateur avec vérification de la clé secrète ADMIN_PW
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body, req.ip);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: env.JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
      });

      sendCreated(res, {
        user: result.user,
        accessToken: result.accessToken
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Connexion administrateur
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password, req.ip);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: env.JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
      });

      sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rafraîchit le jeton d'accès court
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const result = await authService.refresh(refreshToken);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Déconnexion et purge des cookies
   */
  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    sendSuccess(res, { message: 'Déconnexion effectuée avec succès.' });
  }

  /**
   * Récupère le profil de l'administrateur connecté
   */
  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    sendSuccess(res, { admin: req.admin });
  }
}

export const authController = new AuthController();
