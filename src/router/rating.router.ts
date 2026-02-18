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
router.post('/farms/:farmId/rating', isAuthenticated, ratingController.rateFarm);

// Supprimer sa note pour une ferme
router.delete('/farms/:farmId/rating', isAuthenticated, ratingController.deleteRating);

// Récupérer toutes les notes d'une ferme (publique)
router.get('/farms/:farmId/ratings', ratingController.getFarmRatings);

// Récupérer la note de l'utilisateur connecté pour une ferme
router.get('/farms/:farmId/my-rating', isAuthenticated, ratingController.getUserRating);

// Récupérer les statistiques de notation d'une ferme (publique)
router.get('/farms/:farmId/rating-stats', ratingController.getFarmRatingStats);

// Vérifier si l'utilisateur peut noter une ferme
router.get('/farms/:farmId/can-rate', isAuthenticated, ratingController.canUserRateFarm);

export default router;
