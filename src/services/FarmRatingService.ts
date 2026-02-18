import type { PrismaClient } from '@prisma/client';

import prisma from '@/config/prisma/prisma';

// Interface pour les données de notation
interface CreateRatingData {
  farmId: string;
  userId: string;
  score: number; // 1-5
  comment?: string;
}

// Interface pour la réponse de notation
interface RatingResponse {
  id: string;
  score: number;
  comment?: string;
  user: {
    id: string;
    fullname?: string;
  };
  createdAt: Date;
}

// Interface pour les statistiques de notation
interface RatingStats {
  average: number;
  count: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * Service pour la gestion des notations des fermes
 */
export class FarmRatingService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Ajouter ou modifier une note pour une ferme
   * @param data Données de la notation
   * @returns La note créée ou modifiée
   */
  async upsertRating(data: CreateRatingData): Promise<RatingResponse> {
    const { farmId, userId, score, comment } = data;

    // Validation du score
    if (score < 1 || score > 5) {
      throw new Error('La note doit être comprise entre 1 et 5');
    }

    // Vérifier que la ferme existe
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
    });

    if (!farm) {
      throw new Error('Ferme non trouvée');
    }

    // Vérifier que l'utilisateur existe
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    try {
      // Utiliser une transaction pour assurer la cohérence des données
      const result = await this.prisma.$transaction(async (tx) => {
        // Créer ou mettre à jour la note
        const rating = await tx.farmRating.upsert({
          where: {
            farmId_userId: {
              farmId,
              userId,
            },
          },
          update: {
            score,
            comment,
          },
          create: {
            farmId,
            userId,
            score,
            comment,
          },
          include: {
            user: {
              select: {
                user_id: true,
                fullname: true,
              },
            },
          },
        });

        // Recalculer la moyenne et le compteur
        await this.updateFarmRatingStats(tx, farmId);

        return rating;
      });

      return {
        id: result.id,
        score: result.score,
        comment: result.comment || undefined,
        user: {
          id: result.user.user_id,
          fullname: result.user.fullname || undefined,
        },
        createdAt: result.createdAt,
      };
    } catch (error) {
      console.error('Erreur lors de la notation de la ferme:', error);
      throw new Error('Impossible de noter la ferme');
    }
  }

  /**
   * Supprimer la note d'un utilisateur pour une ferme
   * @param farmId ID de la ferme
   * @param userId ID de l'utilisateur
   */
  async deleteRating(farmId: string, userId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Supprimer la note
        const deleted = await tx.farmRating.deleteMany({
          where: {
            farmId,
            userId,
          },
        });

        if (deleted.count === 0) {
          throw new Error('Aucune note trouvée pour cet utilisateur et cette ferme');
        }

        // Recalculer la moyenne et le compteur
        await this.updateFarmRatingStats(tx, farmId);
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la note:', error);
      throw new Error('Impossible de supprimer la note');
    }
  }

  /**
   * Récupérer toutes les notes d'une ferme
   * @param farmId ID de la ferme
   * @param page Page actuelle
   * @param limit Nombre de notes par page
   * @returns Liste des notes avec pagination
   */
  async getFarmRatings(
    farmId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    ratings: RatingResponse[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      this.prisma.farmRating.findMany({
        where: { farmId },
        include: {
          user: {
            select: {
              user_id: true,
              fullname: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.farmRating.count({
        where: { farmId },
      }),
    ]);

    const formattedRatings: RatingResponse[] = ratings.map((rating) => ({
      id: rating.id,
      score: rating.score,
      comment: rating.comment || undefined,
      user: {
        id: rating.user.user_id,
        fullname: rating.user.fullname || undefined,
      },
      createdAt: rating.createdAt,
    }));

    return {
      ratings: formattedRatings,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  /**
   * Récupérer la note d'un utilisateur pour une ferme
   * @param farmId ID de la ferme
   * @param userId ID de l'utilisateur
   * @returns La note de l'utilisateur ou null
   */
  async getUserRating(farmId: string, userId: string): Promise<RatingResponse | null> {
    const rating = await this.prisma.farmRating.findUnique({
      where: {
        farmId_userId: {
          farmId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            user_id: true,
            fullname: true,
          },
        },
      },
    });

    if (!rating) {
      return null;
    }

    return {
      id: rating.id,
      score: rating.score,
      comment: rating.comment || undefined,
      user: {
        id: rating.user.user_id,
        fullname: rating.user.fullname || undefined,
      },
      createdAt: rating.createdAt,
    };
  }

  /**
   * Récupérer les statistiques de notation d'une ferme
   * @param farmId ID de la ferme
   * @returns Statistiques détaillées
   */
  async getFarmRatingStats(farmId: string): Promise<RatingStats> {
    const ratings = await this.prisma.farmRating.findMany({
      where: { farmId },
      select: { score: true },
    });

    if (ratings.length === 0) {
      return {
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    // Calculer la moyenne
    const totalScore = ratings.reduce((sum, rating) => sum + rating.score, 0);
    const average = totalScore / ratings.length;

    // Calculer la distribution
    const distribution = ratings.reduce(
      (acc, rating) => {
        acc[rating.score as keyof typeof acc]++;
        return acc;
      },
      { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    );

    return {
      average: Math.round(average * 100) / 100, // Arrondir à 2 décimales
      count: ratings.length,
      distribution,
    };
  }

  /**
   * Mettre à jour les statistiques de notation d'une ferme
   * @param tx Transaction Prisma
   * @param farmId ID de la ferme
   */
  private async updateFarmRatingStats(tx: any, farmId: string): Promise<void> {
    // Récupérer toutes les notes de la ferme
    const ratings = await tx.farmRating.findMany({
      where: { farmId },
      select: { score: true },
    });

    if (ratings.length === 0) {
      // Si aucune note, réinitialiser les stats
      await tx.farm.update({
        where: { id: farmId },
        data: {
          ratingAvg: 0,
          ratingCount: 0,
        },
      });
      return;
    }

    // Calculer la nouvelle moyenne
    const totalScore = ratings.reduce(
      (sum: number, rating: { score: number }) => sum + rating.score,
      0,
    );
    const average = totalScore / ratings.length;

    // Mettre à jour la ferme
    await tx.farm.update({
      where: { id: farmId },
      data: {
        ratingAvg: Math.round(average * 100) / 100, // Arrondir à 2 décimales
        ratingCount: ratings.length,
      },
    });
  }

  /**
   * Vérifier si un utilisateur peut noter une ferme
   * @param farmId ID de la ferme
   * @param userId ID de l'utilisateur
   * @returns true si l'utilisateur peut noter
   */
  async canUserRateFarm(farmId: string, userId: string): Promise<boolean> {
    // Vérifier que l'utilisateur n'a pas déjà noté cette ferme
    const existingRating = await this.prisma.farmRating.findUnique({
      where: {
        farmId_userId: {
          farmId,
          userId,
        },
      },
    });

    return !existingRating;
  }
}

export default new FarmRatingService();
