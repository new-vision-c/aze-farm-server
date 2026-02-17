import { Router } from 'express';
import { body } from 'express-validator';

import { LocationController } from '@/controllers/location.controller';
import { isAuthenticated } from '@/middlewares/auth';
import { validateRequest } from '@/middlewares/validator.middleware';

const router = Router();
const locationController = new LocationController();

// Middleware d'authentification pour toutes les routes
router.use(isAuthenticated);

/**
 * @route PUT /api/users/location
 * @desc Mettre à jour la position de l'utilisateur
 * @access Private
 */
router.put(
  '/',
  [
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('La latitude doit être un nombre entre -90 et 90'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('La longitude doit être un nombre entre -180 et 180'),
    body('address')
      .optional()
      .isString()
      .isLength({ max: 255 })
      .withMessage("L'adresse ne doit pas dépasser 255 caractères"),
  ],
  validateRequest,
  locationController.updateLocation,
);

/**
 * @route GET /api/users/location
 * @desc Obtenir la position actuelle de l'utilisateur
 * @access Private
 */
router.get('/', locationController.getLocation);

export default router;
