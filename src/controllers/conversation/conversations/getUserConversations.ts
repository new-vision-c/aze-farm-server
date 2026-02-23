import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { asyncHandler, response } from '@/utils/responses/helpers';

//& Récupérer toutes les conversations de l'utilisateur
const getUserConversations = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    try {
      const userId = (req as any).user?.userId;
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      if (!userId) {
        return response.unauthorized(req, res, 'Utilisateur non authentifié');
      }

      const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
          where: {
            OR: [{ consumerId: userId }, { farm: { farmerId: userId } }],
            status: 'ACTIVE',
          },
          include: {
            consumer: {
              select: {
                user_id: true,
                fullname: true,
                avatar_url: true,
              },
            },
            farm: {
              select: {
                id: true,
                name: true,
                images: true,
                description: true,
              },
            },
            messages: {
              orderBy: { sentAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { lastMessageAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.conversation.count({
          where: {
            OR: [{ consumerId: userId }, { farm: { farmerId: userId } }],
            status: 'ACTIVE',
          },
        }),
      ]);

      // Calculer le nombre de messages non lus pour chaque conversation
      const conversationsWithUnreadCount = await Promise.all(
        conversations.map(async (conv) => {
          const unreadCount = await prisma.message.count({
            where: {
              conversationId: conv.id,
              senderId: { not: userId }, // Messages des autres utilisateurs
              isRead: false,
            },
          });

          return {
            ...conv,
            unreadCount,
          };
        }),
      );

      const totalPages = Math.ceil(total / Number(limit));

      return response.ok(
        req,
        res,
        {
          conversations: conversationsWithUnreadCount,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages,
            hasNext: Number(page) < totalPages,
            hasPrev: Number(page) > 1,
          },
        },
        'Conversations récupérées avec succès',
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      return response.serverError(req, res, 'Erreur lors de la récupération des conversations');
    }
  },
);

export default getUserConversations;
