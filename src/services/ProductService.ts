import type { PrismaClient } from '@prisma/client';

import prisma from '../config/prisma/prisma';
import CacheService from './CacheService';
import { SearchAnalyticsService } from './SearchAnalyticsService';

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
  farmId?: string; // Filtrer par ferme spécifique
  seasonal?: boolean; // Produits de saison actuelle
  userId?: string; // Personnaliser selon préférences
  favorites?: boolean; // Mettre en avant les favoris
  history?: boolean; // Éviter les doublons avec l'historique
}

// Interface pour le produit avec distance (format complet)
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
    images?: string[]; // Images de la ferme
  };
  distance?: number; // Distance en km depuis la position de l'utilisateur
}

// Interface pour le format de réponse simplifié
interface ProductResponse {
  id: string;
  name: string;
  price: {
    current: number;
    original?: number; // Prix avant réduction
  };
  unit: string;
  images: {
    main: string; // Première image
  };
  farm: {
    id: string;
    name: string;
    image: string; // Image de la ferme
  };
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
  private analyticsService: SearchAnalyticsService;
  private cacheService: CacheService;

  constructor() {
    this.prisma = prisma;
    this.analyticsService = new SearchAnalyticsService();
    this.cacheService = new CacheService();
  }

  /**
   * Transformer un produit complet en format de réponse simplifié
   * @param product Produit complet avec distance
   * @returns Produit au format de réponse simplifié
   */
  private transformProductResponse(product: ProductWithDistance): ProductResponse {
    return {
      id: product.id,
      name: product.name,
      price: {
        current: product.price,
        // TODO: Ajouter la gestion des réductions ici
        // original: product.originalPrice || undefined,
      },
      unit: product.unit,
      images: {
        main: product.images[0] || '', // Prendre la première image
      },
      farm: {
        id: product.farm.id,
        name: product.farm.name,
        image: product.farm.images?.[0] || '', // Prendre la première image de la ferme
      },
    };
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
  async searchProducts(
    params: SearchProductsParams,
    trackingData?: {
      userId?: string;
      userAgent?: string;
      ipAddress?: string;
    },
  ): Promise<SearchResult> {
    const startTime = Date.now();
    const {
      limit,
      page,
      category,
      productName,
      userLocation,
      farmId,
      seasonal,
      userId,
      favorites,
      history,
    } = params;
    const skip = (page - 1) * limit;

    // Vérifier le cache utilisateur en premier
    if (userId) {
      const cacheKey = {
        limit,
        page,
        category,
        productName,
        userLocation,
        farmId,
        seasonal,
        favorites,
        history,
      };
      const cachedResults = await this.cacheService.getCachedUserSearch(userId, cacheKey);

      if (cachedResults) {
        console.log(`📦 Résultats récupérés depuis cache utilisateur: ${userId}`);
        return {
          products: cachedResults,
          total: cachedResults.length,
          totalPages: Math.ceil(cachedResults.length / limit),
          currentPage: page,
        };
      }
    }

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

    if (farmId) {
      where.farmId = farmId;
    }

    if (seasonal) {
      // Obtenir le mois actuel (1-12)
      const currentMonth = new Date().getMonth() + 1;
      where.seasonality = { has: currentMonth };
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
            images: true, // Ajouter les images de la ferme
          },
        },
      },
      orderBy: [
        { farm: { ratingAvg: 'desc' } }, // Priorité aux fermes mieux notées
        { createdAt: 'desc' }, // Produits les plus récents d'abord
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

    const result = {
      products: productsWithDistance,
      total,
      totalPages,
      currentPage: page,
    };

    // Tracking de la recherche (asynchrone pour ne pas bloquer)
    if (productName || category) {
      const responseTime = Date.now() - startTime;
      void this.trackSearch({
        searchTerm: productName || category || '',
        searchType: productName ? 'product' : 'category',
        resultCount: total,
        userId: trackingData?.userId,
        userAgent: trackingData?.userAgent,
        ipAddress: trackingData?.ipAddress,
        location: userLocation || undefined,
        filters: { category, limit, page },
        responseTime,
      });
    }

    return result;
  }

  /**
   * Tracker une recherche (méthode privée)
   */
  private async trackSearch(data: {
    searchTerm: string;
    searchType: 'product' | 'category';
    resultCount: number;
    userId?: string;
    userAgent?: string;
    ipAddress?: string;
    location?: { latitude: number; longitude: number };
    filters?: Record<string, any>;
    responseTime: number;
  }): Promise<void> {
    try {
      await this.analyticsService.trackSearch(data);
    } catch (error) {
      // Ne pas bloquer la recherche si le tracking échoue
      console.error('Erreur lors du tracking de recherche:', error);
    }
  }

  /**
   * Rechercher des produits avec format de réponse simplifié
   * @param params Paramètres de recherche
   * @returns Produits au format de réponse simplifié avec pagination
   */
  async searchProductsSimplified(params: SearchProductsParams): Promise<{
    items: ProductResponse[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    // Utiliser la méthode existante pour obtenir les produits complets
    const result = await this.searchProducts(params);

    // Transformer chaque produit en format simplifié
    const simplifiedProducts = result.products.map((product) =>
      this.transformProductResponse(product),
    );

    return {
      items: simplifiedProducts,
      totalItems: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
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
   * Obtenir des suggestions de produits basées sur un terme de recherche avec tendances
   * @param searchTerm - Terme de recherche (insensible à la casse)
   * @param limit - Nombre maximum de suggestions à retourner
   * @returns Tableau des noms de produits suggérés
   */
  async getProductSuggestions(searchTerm: string, limit: number = 5): Promise<string[]> {
    try {
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

      // Extraire les noms uniques
      const uniqueNames = Array.from(
        new Map(products.map((product) => [product.name.toLowerCase(), product.name])).values(),
      );

      // Obtenir les suggestions basées sur les tendances
      const trendingSuggestions = await this.analyticsService.getTrendingSuggestions(
        searchTerm,
        Math.floor(limit / 2),
      );

      // Combiner les suggestions tendances avec les suggestions classiques
      const allSuggestions = [...trendingSuggestions];

      // Ajouter les suggestions classiques qui ne sont pas déjà dans les tendances
      uniqueNames.forEach((name: string) => {
        if (!allSuggestions.includes(name)) {
          allSuggestions.push(name);
        }
      });

      // Trier par pertinence : tendances en premier, puis commence par le terme
      const sortedSuggestions = allSuggestions.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        // Les tendances gardent leur ordre
        const aIsTrending = trendingSuggestions.includes(a);
        const bIsTrending = trendingSuggestions.includes(b);

        if (aIsTrending && !bIsTrending) return -1;
        if (!aIsTrending && bIsTrending) return 1;

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

  /**
   * Obtenir les recherches tendances
   */
  async getTrendingSearches(
    limit: number = 10,
  ): Promise<Array<{ term: string; count: number; growth: number }>> {
    try {
      return await this.analyticsService.getTrendingSearches(limit);
    } catch (error) {
      console.error('Erreur lors de la récupération des tendances:', error);
      return [];
    }
  }

  /**
   * Obtenir les statistiques de recherche
   */
  async getSearchStats(days: number = 30): Promise<{
    totalSearches: number;
    uniqueTerms: number;
    avgResponseTime: number;
    topCategories: Array<{ category: string; count: number }>;
  }> {
    try {
      return await this.analyticsService.getSearchStats(days);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return {
        totalSearches: 0,
        uniqueTerms: 0,
        avgResponseTime: 0,
        topCategories: [],
      };
    }
  }
}
