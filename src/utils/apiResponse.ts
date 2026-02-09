import type { I18nService } from '@services/I18nService';
import type { Response } from 'express';

import type { SupportedLanguage, TranslationParams } from '../types/i18n.types';

export interface ApiResponseOptions {
  success?: boolean;
  messageKey?: string;
  message?: string;
  data?: any;
  params?: TranslationParams;
  statusCode?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errors?: any[];
}

export class ApiResponse {
  constructor(
    private res: Response,
    private i18n?: I18nService,
    private language?: SupportedLanguage,
  ) {}

  /**
   * Réponse de succès avec traduction
   */
  success(options: ApiResponseOptions): Response {
    const { messageKey, message, data, params, pagination, statusCode = 200 } = options;

    const response: any = {
      success: true,
      statusCode,
      data: data || null,
    };

    // Ajouter le message traduit ou le message brut
    if (messageKey && this.i18n) {
      response.message = this.i18n.translate(messageKey, this.language, params);
    } else if (message) {
      response.message = message;
    }

    // Ajouter la pagination si présente
    if (pagination) {
      response.pagination = pagination;
    }

    return this.res.status(statusCode).json(response);
  }

  /**
   * Réponse d'erreur avec traduction
   */
  error(options: ApiResponseOptions): Response {
    const { messageKey, message, data, params, errors, statusCode = 500 } = options;

    const response: any = {
      success: false,
      statusCode,
      data: data || null,
    };

    // Ajouter le message traduit ou le message brut
    if (messageKey && this.i18n) {
      response.message = this.i18n.translate(messageKey, this.language, params);
    } else if (message) {
      response.message = message;
    }

    // Ajouter les erreurs si présentes
    if (errors) {
      response.errors = errors;
    }

    return this.res.status(statusCode).json(response);
  }

  /**
   * Réponse de création (201)
   */
  created(options: Omit<ApiResponseOptions, 'statusCode'>): Response {
    return this.success({ ...options, statusCode: 201 });
  }

  /**
   * Réponse d'acceptation (202)
   */
  accepted(options: Omit<ApiResponseOptions, 'statusCode'>): Response {
    return this.success({ ...options, statusCode: 202 });
  }

  /**
   * Réponse de non contenu (204)
   */
  noContent(): Response {
    return this.res.status(204).send();
  }

  /**
   * Réponse de non trouvé (404)
   */
  notFound(options: Omit<ApiResponseOptions, 'statusCode'>): Response {
    return this.error({ ...options, statusCode: 404 });
  }

  /**
   * Réponse de non autorisé (401)
   */
  unauthorized(options: Omit<ApiResponseOptions, 'statusCode'>): Response {
    return this.error({ ...options, statusCode: 401 });
  }

  /**
   * Réponse d'accès interdit (403)
   */
  forbidden(options: Omit<ApiResponseOptions, 'statusCode'>): Response {
    return this.error({ ...options, statusCode: 403 });
  }

  /**
   * Réponse de mauvaise requête (400)
   */
  badRequest(options: Omit<ApiResponseOptions, 'statusCode'>): Response {
    return this.error({ ...options, statusCode: 400 });
  }

  /**
   * Réponse de conflit (409)
   */
  conflict(options: Omit<ApiResponseOptions, 'statusCode'>): Response {
    return this.error({ ...options, statusCode: 409 });
  }

  /**
   * Réponse d'erreur de validation (422)
   */
  validationError(options: Omit<ApiResponseOptions, 'statusCode'>): Response {
    return this.error({ ...options, statusCode: 422 });
  }

  /**
   * Réponse d'erreur serveur (500)
   */
  internalError(options: Omit<ApiResponseOptions, 'statusCode'>): Response {
    return this.error({ ...options, statusCode: 500 });
  }

  /**
   * Réponse paginée
   */
  paginated(
    data: any[],
    page: number,
    limit: number,
    total: number,
    options: Omit<ApiResponseOptions, 'data' | 'pagination'> = {},
  ): Response {
    const totalPages = Math.ceil(total / limit);

    return this.success({
      ...options,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  }
}

/**
 * Factory pour créer une instance ApiResponse depuis une requête Express
 */
export const createApiResponse = (
  res: Response,
  i18n?: I18nService,
  language?: SupportedLanguage,
): ApiResponse => {
  return new ApiResponse(res, i18n, language);
};
