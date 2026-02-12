import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

import { response } from '@/utils/responses/helpers';

/**
 * Middleware pour valider les requêtes avec express-validator
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    response.badRequest(req, res, 'Erreur de validation');
    return;
  }

  next();
};
