import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { I18nService } from '@/services/I18nService';
import { asyncHandler, response } from '@/utils/responses/helpers';

// Instance du service i18n
const i18n = new I18nService();

export class FarmController {
  /**
   * Obtenir les détails d'une ferme spécifique
   */
  getFarmById = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { id } = req.params;
    const { category } = req.query;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    console.log('🔍 DEBUG getFarmById - Requête reçue:', {
      id,
      category,
      idType: typeof id,
      categoryType: typeof category,
    });

    if (!id) {
      return response.badRequest(req, res, i18n.translate('farms.id_required', lang));
    }

    try {
      console.log('🔍 DEBUG getFarmById - Recherche de la ferme avec ID:', id);

      // Récupérer la ferme avec ses informations de base (sans farmer pour éviter l'erreur)
      const farm = await prisma.farm.findUnique({
        where: { id },
      });

      console.log('🔍 DEBUG getFarmById - Résultat recherche ferme:', {
        found: !!farm,
        farmId: farm?.id,
        farmName: farm?.name,
      });

      if (!farm) {
        return response.notFound(req, res, i18n.translate('farms.not_found', lang));
      }

      // Construire le filtre où pour les produits
      const productWhere: any = {
        farmId: id,
        isAvailable: true,
        stock: { gt: 0 },
      };

      // Ajouter le filtre par catégorie si fourni
      if (category && typeof category === 'string' && category.trim()) {
        productWhere.category = {
          contains: category.trim(),
          mode: 'insensitive',
        };
        console.log('🔍 DEBUG getFarmById - Filtre catégorie appliqué:', {
          category: category.trim(),
          productWhere,
        });
      }

      console.log('🔍 DEBUG getFarmById - Recherche des catégories...');

      // Récupérer les catégories uniques des produits de la ferme
      const categories = await prisma.product.findMany({
        where: {
          farmId: id,
          isAvailable: true,
          stock: { gt: 0 },
        },
        select: {
          category: true,
        },
        distinct: ['category'],
      });

      console.log('🔍 DEBUG getFarmById - Catégories trouvées:', {
        count: categories.length,
        categories: categories.map((c) => c.category),
      });

      console.log('🔍 DEBUG getFarmById - Recherche des produits...');

      // Récupérer les produits de la ferme (limités et triés)
      const products = await prisma.product.findMany({
        where: productWhere,
        select: {
          id: true,
          name: true,
          price: true,
          unit: true,
          stock: true,
          images: true,
          category: true,
          createdAt: true,
        },
        orderBy: [
          { createdAt: 'desc' }, // Plus récents d'abord
          { name: 'asc' }, // Puis par ordre alphabétique
        ],
        take: 20, // Limiter à 20 produits
      });

      console.log('🔍 DEBUG getFarmById - Produits trouvés:', {
        count: products.length,
        products: products.map((p) => ({ id: p.id, name: p.name, category: p.category })),
      });

      // Formater la réponse
      const formattedFarm = {
        id: farm.id,
        name: farm.name,
        description: farm.description,
        address: farm.address,
        geoLocation: farm.geoLocation,
        images: farm.images,
        rating: {
          average: farm.ratingAvg,
          count: farm.ratingCount,
        },
        categories: categories.map((c) => c.category).filter(Boolean),
        products: products.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          stock: product.stock,
          image: product.images[0] || null,
          category: product.category,
          createdAt: product.createdAt,
        })),
      };

      console.log('🔍 DEBUG getFarmById - Réponse formatée:', {
        farmId: formattedFarm.id,
        farmName: formattedFarm.name,
        categoriesCount: formattedFarm.categories.length,
        productsCount: formattedFarm.products.length,
      });

      return response.success(req, res, formattedFarm, i18n.translate('farms.retrieved', lang));
    } catch (error) {
      return response.serverError(
        req,
        res,
        i18n.translate('farms.retrieval_error', lang),
        error as Error,
      );
    }
  });
}

export default FarmController;
