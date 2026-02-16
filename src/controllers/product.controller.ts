import type { Request, Response } from 'express';

import { ProductService } from '@/services/ProductService';
import { asyncHandler, response } from '@/utils/responses/helpers';

// Interface pour les paramètres de recherche
interface ProductSearchQuery {
  limit?: string;
  category?: string;
  product?: string;
  lat?: string;
  lng?: string;
  page?: string;
}

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  /**
   * Rechercher des produits avec filtres et localisation
   * @swagger
   * /api/products/search:
   *   get:
   *     tags:
   *       - Products
   *     summary: Rechercher des produits avec filtres et localisation
   *     description: |
   *       Recherche des produits disponibles avec filtres avancés et tri par proximité géographique.
   *       Les produits sont classés par distance de l'utilisateur si les coordonnées sont fournies,
   *       sinon par note de la ferme.
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Nombre maximum de résultats à retourner
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Numéro de page pour la pagination
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           example: "légumes"
   *         description: Filtrer par catégorie de produit
   *       - in: query
   *         name: product
   *         schema:
   *           type: string
   *           example: "tomate"
   *         description: Filtrer par nom de produit (recherche partielle)
   *       - in: query
   *         name: lat
   *         schema:
   *           type: number
   *           minimum: -90
   *           maximum: 90
   *           example: 48.8566
   *         description: Latitude de l'utilisateur pour le calcul de distance
   *       - in: query
   *         name: lng
   *         schema:
   *           type: number
   *           minimum: -180
   *           maximum: 180
   *           example: 2.3522
   *         description: Longitude de l'utilisateur pour le calcul de distance
   *     responses:
   *       200:
   *         description: Produits récupérés avec succès
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
   *                   example: "Produits récupérés avec succès"
   *                 data:
   *                   type: object
   *                   properties:
   *                     items:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/ProductWithDistance'
   *                     totalItems:
   *                       type: integer
   *                       example: 25
   *                     totalPages:
   *                       type: integer
   *                       example: 3
   *                     currentPage:
   *                       type: integer
   *                       example: 1
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  searchProducts = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const query = req.query as ProductSearchQuery;

      // Validation et conversion des paramètres
      const limit = query.limit ? parseInt(query.limit, 10) : 10;
      const page = query.page ? parseInt(query.page, 10) : 1;
      const category = query.category?.trim();
      const productName = query.product?.trim();
      const userLat = query.lat ? parseFloat(query.lat) : null;
      const userLng = query.lng ? parseFloat(query.lng) : null;

      // Validation des paramètres
      if (limit < 1 || limit > 100) {
        return response.badRequest(req, res, 'Le nombre limite doit être entre 1 et 100');
      }

      if (page < 1) {
        return response.badRequest(req, res, 'Le numéro de page doit être supérieur à 0');
      }

      if (userLat && (userLat < -90 || userLat > 90)) {
        return response.badRequest(req, res, 'La latitude doit être entre -90 et 90');
      }

      if (userLng && (userLng < -180 || userLng > 180)) {
        return response.badRequest(req, res, 'La longitude doit être entre -180 et 180');
      }

      try {
        const result = await this.productService.searchProducts({
          limit,
          page,
          category,
          productName,
          userLocation: userLat && userLng ? { latitude: userLat, longitude: userLng } : null,
        });

        return response.paginated(
          req,
          res,
          result.products,
          result.total,
          result.totalPages,
          result.currentPage,
          'Produits récupérés avec succès',
        );
      } catch (error) {
        return response.serverError(
          req,
          res,
          'Erreur lors de la recherche des produits',
          error as Error,
        );
      }
    },
  );

  /**
   * Obtenir les détails d'un produit spécifique
   * @swagger
   * /api/products/{id}:
   *   get:
   *     tags:
   *       - Products
   *     summary: Obtenir les détails d'un produit
   *     description: Récupère les informations complètes d'un produit spécifique incluant les détails de la ferme
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: mongoId
   *         description: ID du produit
   *     responses:
   *       200:
   *         description: Produit récupéré avec succès
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
   *                   example: "Produit récupéré avec succès"
   *                 data:
   *                   $ref: '#/components/schemas/ProductWithDistance'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  getProductById = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const { id } = req.params;

      if (!id) {
        return response.badRequest(req, res, 'ID du produit requis');
      }

      try {
        const product = await this.productService.getProductById(id);

        if (!product) {
          return response.notFound(req, res, 'Produit non trouvé');
        }

        return response.success(req, res, product, 'Produit récupéré avec succès');
      } catch (error) {
        return response.serverError(
          req,
          res,
          'Erreur lors de la récupération du produit',
          error as Error,
        );
      }
    },
  );

  /**
   * Obtenir les catégories disponibles
   * @swagger
   * /api/products/categories:
   *   get:
   *     tags:
   *       - Products
   *     summary: Lister les catégories de produits
   *     description: Récupère la liste de toutes les catégories de produits disponibles
   *     responses:
   *       200:
   *         description: Catégories récupérées avec succès
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
   *                   example: "Catégories récupérées avec succès"
   *                 data:
   *                   type: array
   *                   items:
   *                     type: string
   *                   example: ["légumes", "fruits", "céréales", "produits laitiers"]
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  getCategories = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      try {
        const categories = await this.productService.getCategories();
        return response.success(req, res, categories, 'Catégories récupérées avec succès');
      } catch (error) {
        return response.serverError(
          req,
          res,
          'Erreur lors de la récupération des catégories',
          error as Error,
        );
      }
    },
  );

  /**
   * Obtenir des suggestions de produits basées sur la saisie utilisateur
   * @swagger
   * /api/products/suggestions:
   *   get:
   *     tags:
   *       - Products
   *     summary: Obtenir des suggestions de produits
   *     description: Retourne des suggestions de produits basées sur un terme de recherche partiel
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *           minLength: 1
   *           maxLength: 50
   *         description: Terme de recherche pour suggestions
   *       - in: query
   *         name: limit
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 20
   *           default: 5
   *         description: Nombre de suggestions à retourner
   *     responses:
   *       200:
   *         description: Suggestions récupérées avec succès
   *       400:
   *         description: Erreur de validation
   *       500:
   *         description: Erreur serveur
   */
  getProductSuggestions = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      try {
        const { q, limit = '5' } = req.query;

        // Validation des paramètres
        const searchTerm = (q as string)?.trim().toLowerCase();
        const suggestionLimit = Math.min(parseInt(limit as string) || 5, 20);

        if (!searchTerm || searchTerm.length < 1) {
          return response.badRequest(req, res, 'Le terme de recherche est requis');
        }

        if (searchTerm.length > 50) {
          return response.badRequest(req, res, 'Le terme de recherche est trop long');
        }

        // Obtenir les suggestions depuis le service
        const suggestions = await this.productService.getProductSuggestions(
          searchTerm,
          suggestionLimit,
        );

        return response.success(req, res, suggestions, 'Suggestions récupérées avec succès');
      } catch (error) {
        return response.serverError(
          req,
          res,
          'Erreur lors de la récupération des suggestions',
          error as Error,
        );
      }
    },
  );
}

export default ProductController;
