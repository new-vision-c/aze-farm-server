import type { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

import prisma from '../config/prisma/prisma';

// Interface pour les données de tracking
interface SearchTrackingData {
  searchTerm: string;
  searchType: 'product' | 'category' | 'suggestions';
  resultCount: number;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: { latitude: number; longitude: number };
  filters?: Record<string, any>;
  responseTime: number;
}

/**
 * Service pour le tracking et l'analyse des recherches
 */
export class SearchAnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Hasher une adresse IP pour la confidentialité
   */
  private hashIP(ip: string): string {
    return crypto
      .createHash('sha256')
      .update(ip + process.env.IP_SALT || 'default')
      .digest('hex');
  }

  /**
   * Enregistrer une recherche dans les analytics
   */
  async trackSearch(data: SearchTrackingData): Promise<void> {
    try {
      await this.prisma.searchAnalytics.create({
        data: {
          searchTerm: data.searchTerm.toLowerCase().trim(),
          searchType: data.searchType,
          resultCount: data.resultCount,
          userId: data.userId,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress ? this.hashIP(data.ipAddress) : undefined,
          location: data.location,
          filters: data.filters,
          responseTime: data.responseTime,
        },
      });
    } catch (error) {
      // Ne pas bloquer la recherche si l'enregistrement échoue
      console.error('Erreur lors du tracking de recherche:', error);
    }
  }

  /**
   * Obtenir les termes de recherche tendances sur les 7 derniers jours
   */
  async getTrendingSearches(
    limit: number = 10,
  ): Promise<Array<{ term: string; count: number; growth: number }>> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    try {
      // Recherches des 7 derniers jours
      const recentSearches = await this.prisma.searchAnalytics.groupBy({
        by: ['searchTerm'],
        where: {
          createdAt: { gte: sevenDaysAgo },
          searchType: 'product',
        },
        _count: {
          searchTerm: true,
        },
        orderBy: {
          _count: {
            searchTerm: 'desc',
          },
        },
        take: limit * 2, // Prendre plus pour calculer la croissance
      });

      // Recherches des 7 jours précédents (pour calculer la croissance)
      const previousSearches = await this.prisma.searchAnalytics.groupBy({
        by: ['searchTerm'],
        where: {
          createdAt: {
            gte: fourteenDaysAgo,
            lt: sevenDaysAgo,
          },
          searchType: 'product',
        },
        _count: {
          searchTerm: true,
        },
      });

      // Créer une map pour les recherches précédentes
      const previousMap = new Map(
        previousSearches.map((item) => [item.searchTerm, item._count.searchTerm]),
      );

      // Calculer la croissance et formater les résultats
      const trending = recentSearches.map((item: any) => {
        const currentCount = item._count.searchTerm;
        const previousCount = previousMap.get(item.searchTerm) || 0;
        const growth =
          previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 100;

        return {
          term: item.searchTerm,
          count: currentCount,
          growth: Math.round(growth * 10) / 10, // Arrondir à 1 décimale
        };
      });

      // Trier par croissance puis par nombre de recherches
      return trending
        .sort((a: any, b: any) => {
          if (b.growth !== a.growth) {
            return b.growth - a.growth;
          }
          return b.count - a.count;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la récupération des tendances:', error);
      return [];
    }
  }

  /**
   * Obtenir les suggestions basées sur les tendances
   */
  async getTrendingSuggestions(searchTerm: string, limit: number = 5): Promise<string[]> {
    const trending = await this.getTrendingSearches(20);

    // Filtrer les termes qui correspondent à la recherche
    const matchingTrends = trending
      .filter((item) => item.term.includes(searchTerm.toLowerCase()))
      .map((item) => item.term)
      .slice(0, limit);

    return matchingTrends;
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
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const [totalSearches, uniqueTerms, avgResponseTime, categoryStats] = await Promise.all([
        this.prisma.searchAnalytics.count({
          where: { createdAt: { gte: startDate } },
        }),

        this.prisma.searchAnalytics
          .groupBy({
            by: ['searchTerm'],
            where: { createdAt: { gte: startDate } },
          })
          .then((result: any) => result.length),

        this.prisma.searchAnalytics
          .aggregate({
            where: { createdAt: { gte: startDate } },
            _avg: { responseTime: true },
          })
          .then((result: any) => result._avg.responseTime || 0),

        this.prisma.searchAnalytics.groupBy({
          by: ['searchType'],
          where: {
            createdAt: { gte: startDate },
            searchType: 'category',
          },
          _count: { searchType: true },
          orderBy: { _count: { searchType: 'desc' } },
          take: 5,
        }),
      ]);

      return {
        totalSearches,
        uniqueTerms,
        avgResponseTime: Math.round(avgResponseTime),
        topCategories: categoryStats.map((stat: any) => ({
          category: stat.searchType,
          count: stat._count.searchType,
        })),
      };
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
