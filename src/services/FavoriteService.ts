import type { PrismaClient } from '@prisma/client';

import prisma from '@/config/prisma/prisma';

import CacheService from './CacheService';

// Interface pour les données de favori
interface AddFavoriteData {
  userId: string;
  productId: string;
}

// Interface pour la réponse de favori
interface FavoriteResponse {
  id: string;
  userId: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    unit: string;
    image: string;
    farm: {
      id: string;
      name: string;
    };
  };
  createdAt: Date;
}

// Interface pour les favoris avec pagination
interface FavoritesListResponse {
  favorites: FavoriteResponse[];
  total: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Service pour la gestion des favoris des utilisateurs
 */
export class FavoriteService {
  private prisma: PrismaClient;
  private cacheService: CacheService;

  constructor() {
    this.prisma = prisma;
    this.cacheService = new CacheService();
  }

  /**
   * Ajouter un produit en favori
   * @param data Données du favori
   * @returns Le favori créé
   */
  async addFavorite(data: AddFavoriteData): Promise<FavoriteResponse> {
    const { userId, productId } = data;

    // Vérifier que l'utilisateur existe
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error('Produit non trouvé');
    }

    // Vérifier que le produit n'est pas déjà en favori
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingFavorite) {
      throw new Error('Produit déjà en favori');
    }

    try {
      // Créer le favori
      const favorite = await this.prisma.favorite.create({
        data: {
          userId,
          productId,
        },
        include: {
          product: {
            include: {
              farm: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Mettre à jour le cache des favoris
      await this.updateUserFavoritesCache(userId);

      return {
        id: favorite.id,
        userId: favorite.userId,
        productId: favorite.productId,
        product: {
          id: favorite.product.id,
          name: favorite.product.name,
          price: favorite.product.price,
          unit: favorite.product.unit,
          image: favorite.product.images[0] || '',
          farm: favorite.product.farm,
        },
        createdAt: favorite.createdAt,
      };
    } catch (error) {
      console.error("Erreur lors de l'ajout du favori:", error);
      throw new Error("Impossible d'ajouter le produit en favori");
    }
  }

  /**
   * Supprimer un produit des favoris
   * @param userId ID de l'utilisateur
   * @param productId ID du produit
   */
  async removeFavorite(userId: string, productId: string): Promise<void> {
    try {
      // Supprimer le favori
      const deleted = await this.prisma.favorite.deleteMany({
        where: {
          userId,
          productId,
        },
      });

      if (deleted.count === 0) {
        throw new Error('Aucun favori trouvé pour ce produit');
      }

      // Mettre à jour le cache des favoris
      await this.updateUserFavoritesCache(userId);
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
      throw new Error('Impossible de supprimer le produit des favoris');
    }
  }

  /**
   * Récupérer tous les favoris d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param page Page actuelle
   * @param limit Nombre de favoris par page
   * @returns Liste des favoris avec pagination
   */
  async getUserFavorites(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<FavoritesListResponse> {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              farm: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.favorite.count({
        where: { userId },
      }),
    ]);

    const formattedFavorites: FavoriteResponse[] = favorites.map((favorite) => ({
      id: favorite.id,
      userId: favorite.userId,
      productId: favorite.productId,
      product: {
        id: favorite.product.id,
        name: favorite.product.name,
        price: favorite.product.price,
        unit: favorite.product.unit,
        image: favorite.product.images[0] || '',
        farm: favorite.product.farm,
      },
      createdAt: favorite.createdAt,
    }));

    return {
      favorites: formattedFavorites,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  /**
   * Vérifier si un produit est dans les favoris d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param productId ID du produit
   * @returns true si le produit est en favori
   */
  async isProductFavorite(userId: string, productId: string): Promise<boolean> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return !!favorite;
  }

  /**
   * Récupérer les IDs des produits favoris d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Liste des IDs des produits favoris
   */
  async getUserFavoriteIds(userId: string): Promise<string[]> {
    // Essayer de récupérer depuis le cache d'abord
    const cachedIds = await this.cacheService.getCachedUserFavorites(userId);
    if (cachedIds) {
      return cachedIds;
    }

    // Sinon récupérer depuis la base de données
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { productId: true },
    });

    const favoriteIds = favorites.map((fav) => fav.productId);

    // Mettre en cache pour les prochaines requêtes
    await this.cacheService.cacheUserFavorites(userId, favoriteIds);

    return favoriteIds;
  }

  /**
   * Mettre à jour le cache des favoris d'un utilisateur
   * @param userId ID de l'utilisateur
   */
  private async updateUserFavoritesCache(userId: string): Promise<void> {
    try {
      const favorites = await this.prisma.favorite.findMany({
        where: { userId },
        select: { productId: true },
      });

      const favoriteIds = favorites.map((fav) => fav.productId);
      await this.cacheService.cacheUserFavorites(userId, favoriteIds);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du cache des favoris:', error);
    }
  }

  /**
   * Basculer le statut de favori d'un produit
   * @param userId ID de l'utilisateur
   * @param productId ID du produit
   * @returns true si ajouté, false si supprimé
   */
  async toggleFavorite(userId: string, productId: string): Promise<boolean> {
    const isFavorite = await this.isProductFavorite(userId, productId);

    if (isFavorite) {
      await this.removeFavorite(userId, productId);
      return false; // Supprimé
    } else {
      await this.addFavorite({ userId, productId });
      return true; // Ajouté
    }
  }

  /**
   * Compter le nombre de favoris d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Nombre de favoris
   */
  async getUserFavoritesCount(userId: string): Promise<number> {
    return this.prisma.favorite.count({
      where: { userId },
    });
  }

  /**
   * Compter le nombre de fois qu'un produit a été mis en favori
   * @param productId ID du produit
   * @returns Nombre de favoris pour ce produit
   */
  async getProductFavoritesCount(productId: string): Promise<number> {
    return this.prisma.favorite.count({
      where: { productId },
    });
  }
}

export default new FavoriteService();
