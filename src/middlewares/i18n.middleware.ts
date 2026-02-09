import type { NextFunction, Request, Response } from 'express';

import type { I18nService } from '../services/I18nService';
import type { SupportedLanguage } from '../types/i18n.types';

export class I18nMiddleware {
  constructor(private readonly i18nService: I18nService) {}

  /**
   * Middleware pour détecter et configurer la langue pour chaque requête
   */
  handle() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Détecter la langue depuis le header Accept-Language
      const acceptLanguage = req.headers['accept-language'] as string;
      const detectedLanguage = this.i18nService.detectLanguage(acceptLanguage);

      // Définir la langue pour cette requête
      this.i18nService.setLanguage(detectedLanguage);

      // Rendre le service i18n disponible dans la requête
      (req as any).i18n = this.i18nService;
      (req as any).language = detectedLanguage;

      // Ajouter la langue courante dans les headers de réponse
      res.setHeader('Content-Language', detectedLanguage);

      next();
    };
  }

  /**
   * Middleware pour l'API - retourne les réponses traduites
   */
  apiResponse() {
    return (req: Request, res: Response, next: NextFunction) => {
      const i18n = (req as any).i18n as I18nService;
      const language = (req as any).language as SupportedLanguage;

      // Surcharge de res.json pour inclure automatiquement les traductions
      const originalJson = res.json;
      res.json = function (data: any) {
        // Si la réponse contient une clé de traduction, la traduire
        if (data && typeof data === 'object' && data.messageKey) {
          const translatedMessage = i18n.translate(data.messageKey, language, data.params);
          data.message = translatedMessage;
          // Supprimer la clé de traduction pour ne pas l'exposer
          delete data.messageKey;
          delete data.params;
        }

        return originalJson.call(this, data);
      };

      next();
    };
  }
}
