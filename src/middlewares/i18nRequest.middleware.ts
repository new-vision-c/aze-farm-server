import type { NextFunction, Request, Response } from 'express';

import { SERVICE_KEYS, container } from '../config/services';
import type { I18nService } from '../services/I18nService';
import { createApiResponse } from '../utils/apiResponse';

/**
 * Middleware pour ajouter l'i18n et les utilitaires de réponse dans les requêtes
 */
export const i18nRequestMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Récupérer le service i18n depuis le conteneur
  const i18nService = container.get(SERVICE_KEYS.I18N_SERVICE) as I18nService;

  // Détecter la langue depuis le header Accept-Language
  const acceptLanguage = req.headers['accept-language'] as string;
  const detectedLanguage = i18nService.detectLanguage(acceptLanguage);

  // Définir la langue pour cette requête
  i18nService.setLanguage(detectedLanguage);

  // Rendre le service i18n disponible dans la requête
  (req as any).i18n = i18nService;
  (req as any).language = detectedLanguage;

  // Créer une instance d'ApiResponse disponible dans la requête
  (req as any).apiResponse = createApiResponse(res, i18nService, detectedLanguage);

  // Ajouter la langue courante dans les headers de réponse
  res.setHeader('Content-Language', detectedLanguage);

  next();
};
