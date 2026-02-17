import { Router } from 'express';
import { param, query } from 'express-validator';

import { FarmController } from '../controllers/farm.controller';
import { validateRequest } from '../middlewares/validator.middleware';

const router = Router();
const farmController = new FarmController();

/**
 * @route GET /api/v1/farms/:id
 * @desc Obtenir les détails d'une ferme spécifique
 * @access Public
 * @param {string} id - ID de la ferme
 * @param {string} category - Filtrer les produits par catégorie (optionnel)
 */
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('ID de ferme invalide'),
    query('category')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('La catégorie doit contenir entre 1 et 50 caractères'),
  ],
  validateRequest,
  farmController.getFarmById,
);

export default router;
