import { Router } from 'express';

import FavoriteController from '@/controllers/favorite.controller';
import { isAuthenticated } from '@/middlewares/auth';

const router = Router();
const favoriteController = new FavoriteController();

/**
 * Routes pour la gestion des favoris des utilisateurs
 * Toutes les routes nécessitent une authentification
 */

// Ajouter un produit en favori
router.post('/favorites', isAuthenticated, favoriteController.addFavorite);

// Supprimer un produit des favoris
router.delete('/favorites/:productId', isAuthenticated, favoriteController.removeFavorite);

// Basculer le statut de favori d'un produit
router.post('/favorites/toggle', isAuthenticated, favoriteController.toggleFavorite);

// Récupérer tous les favoris de l'utilisateur
router.get('/favorites', isAuthenticated, favoriteController.getUserFavorites);

// Vérifier si un produit est dans les favoris de l'utilisateur
router.get('/favorites/check/:productId', isAuthenticated, favoriteController.checkFavorite);

// Récupérer le nombre de favoris de l'utilisateur
router.get('/favorites/count', isAuthenticated, favoriteController.getUserFavoritesCount);

// Récupérer les IDs des produits favoris de l'utilisateur
router.get('/favorites/ids', isAuthenticated, favoriteController.getUserFavoriteIds);

export default router;
