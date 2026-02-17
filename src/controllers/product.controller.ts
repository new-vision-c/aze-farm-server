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
  suggestions?: string; // Mode suggestions : "true" ou "false"
  farmId?: string; // Filtrer par ferme spécifique
  seasonal?: string; // Produits de saison actuelle
  userId?: string; // Personnaliser selon préférences
  favorites?: string; // Mettre en avant les favoris
  history?: string; // Éviter les doublons avec l'historique
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
   *       sinon par note de la ferme puis par date de création.
   *
   *       **Filtres disponibles** :
   *       - `farmId` : Filtrer par ferme spécifique
   *       - `seasonal=true` : Uniquement les produits de saison actuelle
   *
   *       **Mode suggestions** : Ajoutez `suggestions=true` pour obtenir des suggestions de noms de produits.
   *       Dans ce mode, seul le paramètre `product` est requis.
   *     parameters:
   *       - in: query
   *         name: suggestions
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Activer le mode suggestions (retourne uniquement des noms de produits)
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
   *         description: Numéro de page pour la pagination (ignoré en mode suggestions)
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           example: "légumes"
   *         description: Filtrer par catégorie de produit (ignoré en mode suggestions)
   *       - in: query
   *         name: product
   *         schema:
   *           type: string
   *           example: "tomate"
   *         description: |
   *           Filtrer par nom de produit (recherche partielle).
   *           En mode suggestions, ce paramètre est requis pour générer les suggestions.
   *       - in: query
   *         name: lat
   *         schema:
   *           type: number
   *           minimum: -90
   *           maximum: 90
   *           example: 48.8566
   *         description: Latitude de l'utilisateur pour le calcul de distance (ignoré en mode suggestions)
   *       - in: query
   *         name: lng
   *         schema:
   *           type: number
   *           minimum: -180
   *           maximum: 180
   *           example: 2.3522
   *         description: Longitude de l'utilisateur pour le calcul de distance (ignoré en mode suggestions)
   *       - in: query
   *         name: farmId
   *         schema:
   *           type: string
   *           example: "507f1f77bcf86cd799439011"
   *         description: Filtrer par ID de ferme spécifique (ignoré en mode suggestions)
   *       - in: query
   *         name: seasonal
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Uniquement les produits de saison actuelle (ignoré en mode suggestions)
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *           example: "507f1f77bcf86cd799439011"
   *         description: Personnaliser les résultats selon les préférences utilisateur (ignoré en mode suggestions)
   *       - in: query
   *         name: favorites
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Mettre en avant les produits favoris de l'utilisateur (ignoré en mode suggestions)
   *       - in: query
   *         name: history
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Éviter les doublons avec l'historique de recherche (ignoré en mode suggestions)
   *     responses:
   *       200:
   *         description: Produits ou suggestions récupérés avec succès
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
   *                   oneOf:
   *                     - type: object
   *                       description: Mode recherche normale
   *                       properties:
   *                         items:
   *                           type: array
   *                           items:
   *                             $ref: '#/components/schemas/ProductWithDistance'
   *                         totalItems:
   *                           type: integer
   *                           example: 25
   *                         totalPages:
   *                           type: integer
   *                           example: 3
   *                         currentPage:
   *                           type: integer
   *                           example: 1
   *                     - type: array
   *                       description: Mode suggestions
   *                       items:
   *                         type: string
   *                       example: ["tomate", "tomate cerise", "tomate cœur de bœuf"]
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  searchProducts = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const query = req.query as ProductSearchQuery;

      // Vérifier si le mode suggestions est activé
      const isSuggestionsMode = query.suggestions === 'true';

      if (isSuggestionsMode) {
        // Mode suggestions : retourner uniquement des suggestions de produits
        const searchTerm = query.product?.trim();

        if (!searchTerm || searchTerm.length < 1) {
          return response.badRequest(
            req,
            res,
            'Le terme de recherche est requis pour les suggestions',
          );
        }

        if (searchTerm.length > 50) {
          return response.badRequest(req, res, 'Le terme de recherche est trop long');
        }

        const suggestionLimit = Math.min(query.limit ? parseInt(query.limit, 10) : 5, 20);

        try {
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
      }

      // Mode recherche normale
      // Validation et conversion des paramètres
      const limit = query.limit ? parseInt(query.limit, 10) : 10;
      const page = query.page ? parseInt(query.page, 10) : 1;
      const category = query.category?.trim();
      const productName = query.product?.trim();
      const userLat = query.lat ? parseFloat(query.lat) : null;
      const userLng = query.lng ? parseFloat(query.lng) : null;
      const farmId = query.farmId?.trim();
      const seasonal = query.seasonal === 'true';
      const userId = query.userId?.trim();
      const favorites = query.favorites === 'true';
      const history = query.history === 'true';

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
        const result = await this.productService.searchProductsSimplified({
          limit,
          page,
          category,
          productName,
          userLocation: userLat && userLng ? { latitude: userLat, longitude: userLng } : null,
          farmId,
          seasonal,
          userId,
          favorites,
          history,
        });

        return response.success(
          req,
          res,
          {
            items: result.items,
            totalItems: result.totalItems,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
          },
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
   *                   type: object
   *                   properties:
   *                     name:
   *                       type: string
   *                       example: "Tomate cerise"
   *                     description:
   *                       type: string
   *                       example: "Tomates cerise sucrées et juteuses"
   *                     price:
   *                       type: number
   *                       example: 4.50
   *                     unit:
   *                       type: string
   *                       example: "kg"
   *                     stock:
   *                       type: integer
   *                       example: 25
   *                     image:
   *                       type: string
   *                       example: "https://example.com/image.jpg"
   *                     farm:
   *                       type: object
   *                       properties:
   *                         name:
   *                           type: string
   *                           example: "Ferme du Soleil"
   *                         image:
   *                           type: string
   *                           example: "https://example.com/farm.jpg"
   *                         rating:
   *                           type: object
   *                           properties:
   *                             average:
   *                               type: number
   *                               example: 4.5
   *                             count:
   *                               type: integer
   *                               example: 12
   *                     otherProducts:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           name:
   *                             type: string
   *                           price:
   *                             type: number
   *                           unit:
   *                             type: string
   *                           stock:
   *                             type: integer
   *                           image:
   *                             type: string
   *                           createdAt:
   *                             type: string
   *                             format: date-time
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

      console.log('🔍 DEBUG getProductById - Requête reçue:', {
        id,
        idType: typeof id,
      });

      if (!id) {
        return response.badRequest(req, res, 'ID du produit requis');
      }

      try {
        console.log('🔍 DEBUG getProductById - Appel au service avec ID:', id);
        const product = await this.productService.getProductById(id);

        console.log('🔍 DEBUG getProductById - Résultat du service:', {
          found: !!product,
          hasName: !!product?.name,
          hasFarm: !!product?.farm,
          hasOtherProducts: !!product?.otherProducts,
          otherProductsCount: product?.otherProducts?.length || 0,
        });

        if (!product) {
          return response.notFound(req, res, 'Produit non trouvé');
        }

        return response.success(req, res, product, 'Produit récupéré avec succès');
      } catch (error) {
        console.log('🔍 DEBUG getProductById - Erreur:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });

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
   * Obtenir les recherches tendances et statistiques
   * @swagger
   * /api/products/trends:
   *   get:
   *     tags:
   *       - Products
   *     summary: Obtenir les tendances de recherche
   *     description: |
   *       Retourne les recherches les plus populaires avec leur croissance,
   *       ainsi que des statistiques sur l'utilisation de la recherche.
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Nombre de tendances à retourner
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 365
   *           default: 30
   *         description: Période d'analyse en jours
   *       - in: query
   *         name: stats
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Inclure les statistiques détaillées
   *     responses:
   *       200:
   *         description: Tendances récupérées avec succès
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
   *                   example: "Tendances récupérées avec succès"
   *                 data:
   *                   type: object
   *                   properties:
   *                     trending:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           term:
   *                             type: string
   *                             example: "tomate"
   *                           count:
   *                             type: integer
   *                             example: 45
   *                           growth:
   *                             type: number
   *                             example: 23.5
   *                     stats:
   *                       type: object
   *                       properties:
   *                         totalSearches:
   *                           type: integer
   *                           example: 1250
   *                         uniqueTerms:
   *                           type: integer
   *                           example: 89
   *                         avgResponseTime:
   *                           type: integer
   *                           example: 120
   *                         topCategories:
   *                           type: array
   *                           items:
   *                             type: object
   *                             properties:
   *                               category:
   *                                 type: string
   *                               count:
   *                                 type: integer
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  getTrends = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    try {
      const { limit = '10', days = '30', stats = 'false' } = req.query;

      const trendsLimit = Math.min(parseInt(limit as string) || 10, 50);
      const statsDays = Math.min(parseInt(days as string) || 30, 365);
      const includeStats = stats === 'true';

      const [trending, searchStats] = await Promise.all([
        this.productService.getTrendingSearches(trendsLimit),
        includeStats ? this.productService.getSearchStats(statsDays) : null,
      ]);

      const responseData: any = { trending };

      if (includeStats && searchStats) {
        responseData.stats = searchStats;
      }

      return response.success(req, res, responseData, 'Tendances récupérées avec succès');
    } catch (error) {
      return response.serverError(
        req,
        res,
        'Erreur lors de la récupération des tendances',
        error as Error,
      );
    }
  });

  /**
   * Obtenir des suggestions de produits basées sur la saisie utilisateur
   * @deprecated Utilisez plutôt /api/products/search?suggestions=true&product=votre_terme
   * @swagger
   * /api/products/suggestions:
   *   get:
   *     tags:
   *       - Products
   *     summary: [OBSOLÈTE] Obtenir des suggestions de produits
   *     deprecated: true
   *     description: |
   *       **CET ENDPOINT EST OBSOLÈTE**
   *
   *       Utilisez plutôt `/api/products/search?suggestions=true&product=votre_terme`
   *
   *       Retourne des suggestions de produits basées sur un terme de recherche partiel
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
