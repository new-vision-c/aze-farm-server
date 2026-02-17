import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { asyncHandler, response } from '@/utils/responses/helpers';

export class FarmController {
  /**
   * Obtenir les détails d'une ferme spécifique
   */
  getFarmById = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { id } = req.params;
    const { category } = req.query;

    if (!id) {
      return response.badRequest(req, res, 'ID de la ferme requis');
    }

    try {
      // Récupérer la ferme avec ses informations de base
      const farm = await prisma.farm.findUnique({
        where: { id },
        include: {
          farmer: {
            select: {
              user_id: true,
              fullname: true,
              email: true,
            },
          },
        },
      });

      if (!farm) {
        return response.notFound(req, res, 'Ferme non trouvée');
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
      }

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

      return response.success(req, res, formattedFarm, 'Ferme récupérée avec succès');
    } catch (error) {
      return response.serverError(
        req,
        res,
        'Erreur lors de la récupération de la ferme',
        error as Error,
      );
    }
  });
}

export default FarmController;
