import type { Request, Response } from 'express';

/**
 * Exemple de contrôleur utilisant l'internationalisation
 * Montre comment utiliser req.apiResponse pour envoyer des réponses traduites
 */
export class ExampleController {
  /**
   * Endpoint de test pour l'internationalisation
   * GET /api/example/test
   */
  public testI18n = (req: Request, res: Response): void => {
    // Utiliser l'utilitaire de réponse avec traduction automatique
    (req as any).apiResponse.success({
      messageKey: 'server.started',
      data: {
        language: (req as any).language,
        timestamp: new Date().toISOString(),
      },
    });
  };

  /**
   * Endpoint de test pour les messages d'erreur
   * GET /api/example/error
   */
  public testError = (req: Request, res: Response): void => {
    (req as any).apiResponse.notFound({
      messageKey: 'users.not_found',
      params: { userId: '123' },
    });
  };

  /**
   * Endpoint de test pour les messages avec paramètres
   * GET /api/example/params
   */
  public testParams = (req: Request, res: Response): void => {
    (req as any).apiResponse.success({
      messageKey: 'crud.created',
      params: { resource: 'Utilisateur' },
      data: {
        created: true,
      },
    });
  };

  /**
   * Endpoint de test pour la validation
   * GET /api/example/validation
   */
  public testValidation = (req: Request, res: Response): void => {
    (req as any).apiResponse.validationError({
      messageKey: 'validation.required',
      params: { field: 'email' },
      errors: [
        {
          field: 'email',
          message: (req as any).i18n.translate('validation.invalid_email'),
        },
      ],
    });
  };

  /**
   * Endpoint de test pour la pagination
   * GET /api/example/pagination
   */
  public testPagination = (req: Request, res: Response): void => {
    const page = 1;
    const limit = 10;
    const total = 25;
    const data = Array.from({ length: limit }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
    }));

    (req as any).apiResponse.paginated(data, page, limit, total, {
      messageKey: 'crud.list_loaded',
      params: { count: limit, resource: 'Item' },
    });
  };
}
