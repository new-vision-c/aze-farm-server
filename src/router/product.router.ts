import { Router } from 'express';
import { param, query } from 'express-validator';

import { ProductController } from '../controllers/product.controller';
import { validateRequest } from '../middlewares/validator.middleware';

const router = Router();
const productController = new ProductController();

/**
 * @route GET /api/v1/products/search
 * @desc Rechercher des produits avec filtres et localisation
 * @access Public
 * @query {number} limit - Nombre de résultats (max 100, défaut: 10)
 * @query {string} category - Catégorie du produit (ex: légumes, fruits)
 * @query {string} product - Nom du produit (ex: tomate, pomme)
 * @query {number} lat - Latitude de l'utilisateur
 * @query {number} lng - Longitude de l'utilisateur
 * @query {number} page - Numéro de page (défaut: 1)
 */
router.get(
  '/search',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Le nombre limite doit être entre 1 et 100'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Le numéro de page doit être supérieur à 0'),
    query('category')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('La catégorie doit contenir entre 1 et 50 caractères'),
    query('product')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Le nom du produit doit contenir entre 1 et 100 caractères'),
    query('lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('La latitude doit être entre -90 et 90'),
    query('lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('La longitude doit être entre -180 et 180'),
  ],
  validateRequest,
  productController.searchProducts,
);

/**
 * @route GET /api/v1/products/categories
 * @desc Obtenir toutes les catégories disponibles
 * @access Public
 */
router.get('/categories', productController.getCategories);

/**
 * @route GET /api/v1/products/suggestions
 * @desc Obtenir des suggestions de produits basées sur la saisie utilisateur
 * @access Public
 * @query {string} q - Terme de recherche pour suggestions
 * @query {number} limit - Nombre de suggestions (max 20, défaut: 5)
 */
router.get(
  '/suggestions',
  [
    query('q')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Le terme de recherche doit contenir entre 1 et 50 caractères'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Le nombre limite doit être entre 1 et 20'),
  ],
  validateRequest,
  productController.getProductSuggestions,
);

/**
 * @route GET /api/v1/products/:id
 * @desc Obtenir les détails d'un produit spécifique
 * @access Public
 * @param {string} id - ID du produit
 */
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('ID de produit invalide')],
  validateRequest,
  productController.getProductById,
);

export default router;
