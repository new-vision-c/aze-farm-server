import type { Request, Response } from 'express';

import FarmRatingService from '@/services/FarmRatingService';
import { I18nService } from '@/services/I18nService';
import { asyncHandler, response } from '@/utils/responses/helpers';

// Instance du service i18n
const i18n = new I18nService();

export class RatingController {
  /**
   * Noter une ferme (créer ou modifier)
   * POST /api/farms/:farmId/rating
   */
  rateFarm = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { farmId } = req.params;
    const { score, comment } = req.body;
    const userId = (req as any).user?.user_id;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    console.log('🔍 RatingController.rateFarm - Requête reçue:', {
      farmId,
      userId,
      score,
      comment,
    });

    if (!userId) {
      return response.unauthorized(req, res, i18n.translate('ratings.auth_required', lang));
    }

    if (!farmId) {
      return response.badRequest(req, res, i18n.translate('ratings.farm_id_required', lang));
    }

    // Validation du score
    if (!score || score < 1 || score > 5) {
      return response.badRequest(req, res, i18n.translate('ratings.score_range', lang));
    }

    try {
      const rating = await FarmRatingService.upsertRating({
        farmId,
        userId,
        score: parseInt(score),
        comment: comment?.trim() || undefined,
      });

      console.log('🔍 RatingController.rateFarm - Note enregistrée:', {
        ratingId: rating.id,
        score: rating.score,
      });

      return response.success(req, res, rating, i18n.translate('ratings.saved', lang));
    } catch (error) {
      console.error('Erreur lors de la notation de la ferme:', error);
      return response.serverError(
        req,
        res,
        i18n.translate('ratings.save_error', lang),
        error as Error,
      );
    }
  });

  /**
   * Supprimer sa note pour une ferme
   * DELETE /api/farms/:farmId/rating
   */
  deleteRating = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const { farmId } = req.params;
      const userId = (req as any).user?.user_id;
      const lang = i18n.detectLanguage(req.headers['accept-language']);

      console.log('🔍 RatingController.deleteRating - Requête reçue:', {
        farmId,
        userId,
      });

      if (!userId) {
        return response.unauthorized(req, res, i18n.translate('ratings.auth_required', lang));
      }

      if (!farmId) {
        return response.badRequest(req, res, i18n.translate('ratings.farm_id_required', lang));
      }

      try {
        await FarmRatingService.deleteRating(farmId, userId);

        console.log('🔍 RatingController.deleteRating - Note supprimée:', {
          farmId,
          userId,
        });

        return response.success(req, res, null, i18n.translate('ratings.deleted', lang));
      } catch (error) {
        console.error('Erreur lors de la suppression de la note:', error);
        return response.serverError(
          req,
          res,
          i18n.translate('ratings.delete_error', lang),
          error as Error,
        );
      }
    },
  );

  /**
   * Récupérer toutes les notes d'une ferme
   * GET /api/farms/:farmId/ratings
   */
  getFarmRatings = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const { farmId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const lang = i18n.detectLanguage(req.headers['accept-language']);

      console.log('🔍 RatingController.getFarmRatings - Requête reçue:', {
        farmId,
        page,
        limit,
      });

      if (!farmId) {
        return response.badRequest(req, res, i18n.translate('ratings.farm_id_required', lang));
      }

      // Validation de la pagination
      if (page < 1) {
        return response.badRequest(req, res, i18n.translate('ratings.page_positive', lang));
      }

      if (limit < 1 || limit > 50) {
        return response.badRequest(req, res, i18n.translate('ratings.limit_range', lang));
      }

      try {
        const result = await FarmRatingService.getFarmRatings(farmId, page, limit);

        console.log('🔍 RatingController.getFarmRatings - Notes récupérées:', {
          farmId,
          total: result.total,
          currentPage: result.currentPage,
        });

        return response.success(req, res, result, i18n.translate('ratings.retrieved', lang));
      } catch (error) {
        console.error('Erreur lors de la récupération des notes:', error);
        return response.serverError(
          req,
          res,
          i18n.translate('ratings.retrieve_error', lang),
          error as Error,
        );
      }
    },
  );

  /**
   * Récupérer la note de l'utilisateur connecté pour une ferme
   * GET /api/farms/:farmId/my-rating
   */
  getUserRating = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const { farmId } = req.params;
      const userId = (req as any).user?.user_id;
      const lang = i18n.detectLanguage(req.headers['accept-language']);

      console.log('🔍 RatingController.getUserRating - Requête reçue:', {
        farmId,
        userId,
      });

      if (!userId) {
        return response.unauthorized(req, res, i18n.translate('ratings.auth_required', lang));
      }

      if (!farmId) {
        return response.badRequest(req, res, i18n.translate('ratings.farm_id_required', lang));
      }

      try {
        const rating = await FarmRatingService.getUserRating(farmId, userId);

        console.log('🔍 RatingController.getUserRating - Note utilisateur:', {
          farmId,
          userId,
          hasRating: !!rating,
        });

        return response.success(
          req,
          res,
          rating,
          i18n.translate('ratings.user_rating_retrieved', lang),
        );
      } catch (error) {
        console.error('Erreur lors de la récupération de la note utilisateur:', error);
        return response.serverError(
          req,
          res,
          i18n.translate('ratings.user_rating_error', lang),
          error as Error,
        );
      }
    },
  );

  /**
   * Récupérer les statistiques de notation d'une ferme
   * GET /api/farms/:farmId/rating-stats
   */
  getFarmRatingStats = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const { farmId } = req.params;
      const lang = i18n.detectLanguage(req.headers['accept-language']);

      console.log('🔍 RatingController.getFarmRatingStats - Requête reçue:', {
        farmId,
      });

      if (!farmId) {
        return response.badRequest(req, res, i18n.translate('ratings.farm_id_required', lang));
      }

      try {
        const stats = await FarmRatingService.getFarmRatingStats(farmId);

        console.log('🔍 RatingController.getFarmRatingStats - Statistiques récupérées:', {
          farmId,
          average: stats.average,
          count: stats.count,
        });

        return response.success(req, res, stats, i18n.translate('ratings.stats_retrieved', lang));
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return response.serverError(
          req,
          res,
          i18n.translate('ratings.stats_error', lang),
          error as Error,
        );
      }
    },
  );

  /**
   * Vérifier si l'utilisateur peut noter une ferme
   * GET /api/farms/:farmId/can-rate
   */
  canUserRateFarm = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const { farmId } = req.params;
      const userId = (req as any).user?.user_id;
      const lang = i18n.detectLanguage(req.headers['accept-language']);

      console.log('🔍 RatingController.canUserRateFarm - Requête reçue:', {
        farmId,
        userId,
      });

      if (!userId) {
        return response.unauthorized(req, res, i18n.translate('ratings.auth_required', lang));
      }

      if (!farmId) {
        return response.badRequest(req, res, i18n.translate('ratings.farm_id_required', lang));
      }

      try {
        const canRate = await FarmRatingService.canUserRateFarm(farmId, userId);

        console.log('🔍 RatingController.canUserRateFarm - Vérification:', {
          farmId,
          userId,
          canRate,
        });

        return response.success(
          req,
          res,
          { canRate },
          i18n.translate('ratings.check_completed', lang),
        );
      } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        return response.serverError(
          req,
          res,
          i18n.translate('ratings.check_error', lang),
          error as Error,
        );
      }
    },
  );
}

export default RatingController;
