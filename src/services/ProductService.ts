import type { PrismaClient } from '@prisma/client';

import prisma from '@/config/prisma/prisma';

// Interface pour les coordonnées géographiques
interface GeoLocation {
  latitude: number;
  longitude: number;
}

// Interface pour les paramètres de recherche
interface SearchProductsParams {
  limit: number;
  page: number;
  category?: string;
  productName?: string;
  userLocation?: GeoLocation | null;
}

// Interface pour le produit avec distance
interface ProductWithDistance {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  category: string;
  isAvailable: boolean;
  seasonality: number[];
  images: string[];
  farm: {
    id: string;
    name: string;
    address: string;
    geoLocation?: GeoLocation | null;
    ratingAvg: number;
    ratingCount: number;
  };
  distance?: number; // Distance en km depuis la position de l'utilisateur
}

// Interface pour le résultat de recherche
interface SearchResult {
  products: ProductWithDistance[];
  total: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Service pour la gestion des produits avec recherche et localisation
 */
export class ProductService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Calculer la distance entre deux points géographiques (formule de Haversine)
   * @param lat1 Latitude du premier point
   * @param lng1 Longitude du premier point
   * @param lat2 Latitude du deuxième point
   * @param lng2 Longitude du deuxième point
   * @returns Distance en kilomètres
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convertir les degrés en radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Rechercher des produits avec filtres et localisation
   */
  async searchProducts(params: SearchProductsParams): Promise<SearchResult> {
    const { limit, page, category, productName, userLocation } = params;
    const skip = (page - 1) * limit;

    // Construire les filtres
    const where: any = {
      isAvailable: true,
      stock: { gt: 0 },
      farm: { isActive: true },
    };

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (productName) {
      where.name = { contains: productName, mode: 'insensitive' };
    }

    // Compter le nombre total de produits correspondants
    const total = await this.prisma.product.count({ where });

    // Récupérer les produits avec pagination
    const products = await this.prisma.product.findMany({
      where,
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            address: true,
            geoLocation: true,
            ratingAvg: true,
            ratingCount: true,
          },
        },
      },
      orderBy: [
        { farm: { ratingAvg: 'desc' } }, // Priorité aux fermes mieux notées
        { name: 'asc' }, // Ordre alphabétique
      ],
      skip,
      take: limit,
    });

    // Ajouter la distance si la localisation de l'utilisateur est fournie
    let productsWithDistance: ProductWithDistance[] = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      stock: product.stock,
      category: product.category,
      isAvailable: product.isAvailable,
      seasonality: product.seasonality,
      images: product.images,
      farm: product.farm as any,
    }));

    if (userLocation) {
      productsWithDistance = productsWithDistance.map((product) => {
        let distance: number | undefined;

        if (product.farm.geoLocation) {
          distance = this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            product.farm.geoLocation.latitude,
            product.farm.geoLocation.longitude,
          );
        }

        return {
          ...product,
          distance,
        };
      });

      // Trier par distance (les plus proches en premier)
      productsWithDistance.sort((a, b) => {
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    // Calculer le nombre total de pages
    const totalPages = Math.ceil(total / limit);

    return {
      products: productsWithDistance,
      total,
      totalPages,
      currentPage: page,
    };
  }

  /**
   * Obtenir un produit par son ID
   */
  async getProductById(id: string): Promise<ProductWithDistance | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            address: true,
            geoLocation: true,
            ratingAvg: true,
            ratingCount: true,
          },
        },
      },
    });

    if (!product) {
      return null;
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      stock: product.stock,
      category: product.category,
      isAvailable: product.isAvailable,
      seasonality: product.seasonality,
      images: product.images,
      farm: product.farm as any,
    };
  }

  /**
   * Obtenir toutes les catégories uniques de produits
   */
  async getCategories(): Promise<string[]> {
    const categories = await this.prisma.product.findMany({
      where: {
        isAvailable: true,
        stock: { gt: 0 },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return categories
      .map((c) => c.category)
      .filter(Boolean)
      .sort();
  }

  /**
   * Obtenir les produits les plus proches de la position de l'utilisateur
   */
  async getNearestProducts(
    userLocation: GeoLocation,
    limit: number = 10,
  ): Promise<ProductWithDistance[]> {
    const result = await this.searchProducts({
      limit,
      page: 1,
      userLocation,
    });

    return result.products.filter((product) => product.distance !== undefined);
  }

  /**
   * Obtenir des suggestions de produits basées sur un terme de recherche
   * @param searchTerm - Terme de recherche (insensible à la casse)
   * @param limit - Nombre maximum de suggestions à retourner
   * @returns Tableau des noms de produits suggérés
   */
  async getProductSuggestions(searchTerm: string, limit: number = 5): Promise<string[]> {
    try {
      // Créer une expression régulière pour la recherche partielle
      const searchRegex = new RegExp(searchTerm, 'i'); // 'i' pour insensible à la casse

      // Rechercher les produits dont le nom correspond au terme
      const products = await prisma.product.findMany({
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive', // Prisma supporte la recherche insensible à la casse
          },
          isAvailable: true, // Uniquement les produits disponibles
        },
        select: {
          name: true,
        },
        take: limit * 2, // Prendre plus de résultats pour pouvoir filtrer et dédupliquer
        orderBy: {
          name: 'asc',
        },
      });

      // Extraire les noms uniques et les trier par pertinence
      const uniqueNames = Array.from(
        new Map(products.map((product) => [product.name.toLowerCase(), product.name])).values(),
      );

      // Trier par pertinence : commence par le terme recherché en premier
      const sortedSuggestions = uniqueNames.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        // Priorité aux noms qui commencent par le terme de recherche
        const aStartsWith = aLower.startsWith(searchLower);
        const bStartsWith = bLower.startsWith(searchLower);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        // Sinon, tri alphabétique
        return a.localeCompare(b, 'fr', { sensitivity: 'base' });
      });

      return sortedSuggestions.slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions:', error);
      throw new Error('Impossible de récupérer les suggestions de produits');
    }
  }
}
