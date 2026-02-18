import type { Request, Response } from 'express';

import FavoriteService from '@/services/FavoriteService';
import { asyncHandler, response } from '@/utils/responses/helpers';

export class FavoriteController {
  /**
   * Ajouter un produit en favori
   * POST /api/v1/favorites
   */
  addFavorite = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { productId } = req.body;
    const userId = (req as any).user?.user_id;

    console.log('🔍 FavoriteController.addFavorite - Requête reçue:', {
      userId,
      productId,
    });

    if (!userId) {
      return response.unauthorized(req, res, 'Authentification requise');
    }

    if (!productId) {
      return response.badRequest(req, res, 'ID du produit requis');
    }

    try {
      const favorite = await FavoriteService.addFavorite({
        userId,
        productId,
      });

      console.log('🔍 FavoriteController.addFavorite - Favori ajouté:', {
        favoriteId: favorite.id,
        productId: favorite.productId,
      });

      return response.success(req, res, favorite, 'Produit ajouté aux favoris avec succès');
    } catch (error) {
      console.error("Erreur lors de l'ajout du favori:", error);
      return response.serverError(
        req,
        res,
        "Erreur lors de l'ajout du produit aux favoris",
        error as Error,
      );
    }
  });

  /**
   * Supprimer un produit des favoris
   * DELETE /api/v1/favorites/:productId
   */
  removeFavorite = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const { productId } = req.params;
      const userId = (req as any).user?.user_id;

      console.log('🔍 FavoriteController.removeFavorite - Requête reçue:', {
        userId,
        productId,
      });

      if (!userId) {
        return response.unauthorized(req, res, 'Authentification requise');
      }

      if (!productId) {
        return response.badRequest(req, res, 'ID du produit requis');
      }

      try {
        await FavoriteService.removeFavorite(userId, productId);

        console.log('🔍 FavoriteController.removeFavorite - Favori supprimé:', {
          userId,
          productId,
        });

        return response.success(req, res, null, 'Produit retiré des favoris avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression du favori:', error);
        return response.serverError(
          req,
          res,
          'Erreur lors de la suppression du produit des favoris',
          error as Error,
        );
      }
    },
  );

  /**
   * Basculer le statut de favori d'un produit
   * POST /api/v1/favorites/toggle
   */
  toggleFavorite = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const { productId } = req.body;
      const userId = (req as any).user?.user_id;

      console.log('🔍 FavoriteController.toggleFavorite - Requête reçue:', {
        userId,
        productId,
      });

      if (!userId) {
        return response.unauthorized(req, res, 'Authentification requise');
      }

      if (!productId) {
        return response.badRequest(req, res, 'ID du produit requis');
      }

      try {
        const isAdded = await FavoriteService.toggleFavorite(userId, productId);

        console.log('🔍 FavoriteController.toggleFavorite - Toggle effectué:', {
          userId,
          productId,
          isAdded,
        });

        const message = isAdded ? 'Produit ajouté aux favoris' : 'Produit retiré des favoris';
        return response.success(req, res, { isAdded }, message);
      } catch (error) {
        console.error('Erreur lors du basculement du favori:', error);
        return response.serverError(
          req,
          res,
          'Erreur lors du basculement du statut du favori',
          error as Error,
        );
      }
    },
  );

  /**
   * Récupérer tous les favoris de l'utilisateur
   * GET /api/v1/favorites
   */
  getUserFavorites = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const userId = (req as any).user?.user_id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      console.log('🔍 FavoriteController.getUserFavorites - Requête reçue:', {
        userId,
        page,
        limit,
      });

      if (!userId) {
        return response.unauthorized(req, res, 'Authentification requise');
      }

      // Validation de la pagination
      if (page < 1) {
        return response.badRequest(req, res, 'La page doit être supérieure à 0');
      }

      if (limit < 1 || limit > 50) {
        return response.badRequest(req, res, 'La limite doit être entre 1 et 50');
      }

      try {
        const result = await FavoriteService.getUserFavorites(userId, page, limit);

        console.log('🔍 FavoriteController.getUserFavorites - Favoris récupérés:', {
          userId,
          total: result.total,
          currentPage: result.currentPage,
        });

        return response.success(req, res, result, 'Favoris récupérés avec succès');
      } catch (error) {
        console.error('Erreur lors de la récupération des favoris:', error);
        return response.serverError(
          req,
          res,
          'Erreur lors de la récupération des favoris',
          error as Error,
        );
      }
    },
  );

  /**
   * Vérifier si un produit est dans les favoris de l'utilisateur
   * GET /api/v1/favorites/check/:productId
   */
  checkFavorite = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const { productId } = req.params;
      const userId = (req as any).user?.user_id;

      console.log('🔍 FavoriteController.checkFavorite - Requête reçue:', {
        userId,
        productId,
      });

      if (!userId) {
        return response.unauthorized(req, res, 'Authentification requise');
      }

      if (!productId) {
        return response.badRequest(req, res, 'ID du produit requis');
      }

      try {
        const isFavorite = await FavoriteService.isProductFavorite(userId, productId);

        console.log('🔍 FavoriteController.checkFavorite - Vérification:', {
          userId,
          productId,
          isFavorite,
        });

        return response.success(req, res, { isFavorite }, 'Vérification terminée avec succès');
      } catch (error) {
        console.error('Erreur lors de la vérification du favori:', error);
        return response.serverError(
          req,
          res,
          'Erreur lors de la vérification du statut du favori',
          error as Error,
        );
      }
    },
  );

  /**
   * Récupérer le nombre de favoris de l'utilisateur
   * GET /api/v1/favorites/count
   */
  getUserFavoritesCount = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const userId = (req as any).user?.user_id;

      console.log('🔍 FavoriteController.getUserFavoritesCount - Requête reçue:', {
        userId,
      });

      if (!userId) {
        return response.unauthorized(req, res, 'Authentification requise');
      }

      try {
        const count = await FavoriteService.getUserFavoritesCount(userId);

        console.log('🔍 FavoriteController.getUserFavoritesCount - Compte:', {
          userId,
          count,
        });

        return response.success(req, res, { count }, 'Nombre de favoris récupéré avec succès');
      } catch (error) {
        console.error('Erreur lors du comptage des favoris:', error);
        return response.serverError(
          req,
          res,
          'Erreur lors du comptage des favoris',
          error as Error,
        );
      }
    },
  );

  /**
   * Récupérer les IDs des produits favoris de l'utilisateur
   * GET /api/v1/favorites/ids
   */
  getUserFavoriteIds = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const userId = (req as any).user?.user_id;

      console.log('🔍 FavoriteController.getUserFavoriteIds - Requête reçue:', {
        userId,
      });

      if (!userId) {
        return response.unauthorized(req, res, 'Authentification requise');
      }

      try {
        const favoriteIds = await FavoriteService.getUserFavoriteIds(userId);

        console.log('🔍 FavoriteController.getUserFavoriteIds - IDs récupérés:', {
          userId,
          count: favoriteIds.length,
        });

        return response.success(req, res, { favoriteIds }, 'IDs des favoris récupérés avec succès');
      } catch (error) {
        console.error('Erreur lors de la récupération des IDs des favoris:', error);
        return response.serverError(
          req,
          res,
          'Erreur lors de la récupération des IDs des favoris',
          error as Error,
        );
      }
    },
  );
}

export default FavoriteController;
