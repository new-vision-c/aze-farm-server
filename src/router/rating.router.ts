import { Router } from 'express';

import RatingController from '@/controllers/farm/rating.controller';
import { isAuthenticated } from '@/middlewares/auth';

const router = Router();
const ratingController = new RatingController();

/**
 * Routes pour la gestion des notations des fermes
 * Toutes les routes nécessitent une authentification
 */

// Noter une ferme (créer ou modifier sa note)
/**
 * @swagger
 * /api/farms/:farmId/rating:
 *   post:
 *     summary: "POST /api/farms/:farmId/rating"
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farmId
 *         required: true
 *         schema:
 *           type: string
 *         description: "farmId"
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
router.post('/farms/:farmId/rating', isAuthenticated, ratingController.rateFarm);

// Supprimer sa note pour une ferme
router.delete('/farms/:farmId/rating', isAuthenticated, ratingController.deleteRating);

// Récupérer toutes les notes d'une ferme (publique)
/**
 * @swagger
 * /api/farms/:farmId/ratings:
 *   get:
 *     summary: "GET /api/farms/:farmId/ratings"
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farmId
 *         required: true
 *         schema:
 *           type: string
 *         description: "farmId"
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
router.get('/farms/:farmId/ratings', ratingController.getFarmRatings);

// Récupérer la note de l'utilisateur connecté pour une ferme
/**
 * @swagger
 * /api/farms/:farmId/my-rating:
 *   get:
 *     summary: "GET /api/farms/:farmId/my-rating"
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farmId
 *         required: true
 *         schema:
 *           type: string
 *         description: "farmId"
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
router.get('/farms/:farmId/my-rating', isAuthenticated, ratingController.getUserRating);

// Récupérer les statistiques de notation d'une ferme (publique)
/**
 * @swagger
 * /api/farms/:farmId/rating-stats:
 *   get:
 *     summary: "GET /api/farms/:farmId/rating-stats"
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farmId
 *         required: true
 *         schema:
 *           type: string
 *         description: "farmId"
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
router.get('/farms/:farmId/rating-stats', ratingController.getFarmRatingStats);

// Vérifier si l'utilisateur peut noter une ferme
/**
 * @swagger
 * /api/farms/:farmId/can-rate:
 *   get:
 *     summary: "GET /api/farms/:farmId/can-rate"
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farmId
 *         required: true
 *         schema:
 *           type: string
 *         description: "farmId"
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
router.get('/farms/:farmId/can-rate', isAuthenticated, ratingController.canUserRateFarm);

export default router;
