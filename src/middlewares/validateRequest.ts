import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse';
import { ErrorCodes } from '../constants/errorCodes';

/**
 * ============================================================================
 * KEVYLAB — MIDDLEWARE UNIVERSEL DE VALIDATION ZOD
 * ============================================================================
 * Valide de manière typée et sécurisée les composants d'une requête HTTP :
 * le corps (body), les paramètres d'URL (params) et la chaîne de requête (query).
 * ============================================================================
 */

interface RequestValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export const validateRequest = (schemas: RequestValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        sendError(
          res,
          400,
          ErrorCodes.VALIDATION_ERROR,
          'Données de requête invalides ou incomplètes.',
          details
        );
        return;
      }
      next(error);
    }
  };
};
