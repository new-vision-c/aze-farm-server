import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { asyncHandler, response } from '@/utils/responses/helpers';

//& Récupérer le nombre de messages non lus
const getUnreadCount = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return response.unauthorized(req, res, 'Utilisateur non authentifié');
      }

      // Utiliser les vrais modèles Prisma maintenant qu'ils sont générés
      const unreadCount = await prisma.message.count({
        where: {
          conversation: {
            OR: [{ consumerId: userId }, { farm: { farmerId: userId } }],
          },
          senderId: { not: userId }, // Messages des autres utilisateurs
          isRead: false,
        },
      });

      return response.ok(
        req,
        res,
        { unreadCount },
        'Nombre de messages non lus récupéré avec succès',
      );
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de messages non lus:', error);
      return response.serverError(
        req,
        res,
        'Erreur lors de la récupération du nombre de messages non lus',
      );
    }
  },
);

export default getUnreadCount;
