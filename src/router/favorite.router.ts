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
/**
 * @swagger
 * /api/favorites:
 *   post:
 *     summary: "POST /api/favorites"
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Opération réussie"
 *                 data:
 *                   type: object
 *                   description: "Données de réponse"
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non authentifié"
 *       500:
 *         description: "Erreur serveur"
 */
router.post('/favorites', isAuthenticated, favoriteController.addFavorite);

// Supprimer un produit des favoris
/**
 * @swagger
 * /api/favorites/:productId:
 *   delete:
 *     summary: "DELETE /api/favorites/:productId"
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: "productId"
 *     responses:
 *       200:
 *         description: "Succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Opération réussie"
 *                 data:
 *                   type: object
 *                   description: "Données de réponse"
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non authentifié"
 *       500:
 *         description: "Erreur serveur"
 */
router.delete('/favorites/:productId', isAuthenticated, favoriteController.removeFavorite);

// Basculer le statut de favori d'un produit
/**
 * @swagger
 * /api/favorites/toggle:
 *   post:
 *     summary: "POST /api/favorites/toggle"
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Opération réussie"
 *                 data:
 *                   type: object
 *                   description: "Données de réponse"
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non authentifié"
 *       500:
 *         description: "Erreur serveur"
 */
router.post('/favorites/toggle', isAuthenticated, favoriteController.toggleFavorite);

// Récupérer tous les favoris de l'utilisateur
router.get('/favorites', isAuthenticated, favoriteController.getUserFavorites);

// Vérifier si un produit est dans les favoris de l'utilisateur
/**
 * @swagger
 * /api/favorites/check/:productId:
 *   get:
 *     summary: "GET /api/favorites/check/:productId"
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: "productId"
 *     responses:
 *       200:
 *         description: "Succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Opération réussie"
 *                 data:
 *                   type: object
 *                   description: "Données de réponse"
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non authentifié"
 *       500:
 *         description: "Erreur serveur"
 */
router.get('/favorites/check/:productId', isAuthenticated, favoriteController.checkFavorite);

// Récupérer le nombre de favoris de l'utilisateur
/**
 * @swagger
 * /api/favorites/count:
 *   get:
 *     summary: "GET /api/favorites/count"
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Opération réussie"
 *                 data:
 *                   type: object
 *                   description: "Données de réponse"
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non authentifié"
 *       500:
 *         description: "Erreur serveur"
 */
router.get('/favorites/count', isAuthenticated, favoriteController.getUserFavoritesCount);

// Récupérer les IDs des produits favoris de l'utilisateur
/**
 * @swagger
 * /api/favorites/ids:
 *   get:
 *     summary: "GET /api/favorites/ids"
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Opération réussie"
 *                 data:
 *                   type: object
 *                   description: "Données de réponse"
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non authentifié"
 *       500:
 *         description: "Erreur serveur"
 */
router.get('/favorites/ids', isAuthenticated, favoriteController.getUserFavoriteIds);

export default router;
