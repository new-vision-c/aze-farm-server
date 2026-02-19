import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { asyncHandler, response } from '@/utils/responses/helpers';

//& Récupérer les messages d'une conversation
const getConversationMessages = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    try {
      const userId = (req as any).user?.id;
      const { conversationId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      if (!userId) {
        return response.unauthorized(req, res, 'Utilisateur non authentifié');
      }

      // Vérifier que l'utilisateur a accès à cette conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [{ consumerId: userId }, { farm: { farmerId: userId } }],
        },
      });

      if (!conversation) {
        return response.notFound(req, res, 'Conversation non trouvée ou accès non autorisé');
      }

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { conversationId },
          include: {
            sender: {
              select: {
                user_id: true,
                fullname: true,
                avatar_url: true,
              },
            },
          },
          orderBy: { sentAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.message.count({
          where: { conversationId },
        }),
      ]);

      // Marquer les messages comme lus pour cet utilisateur
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId }, // Messages des autres utilisateurs
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      const totalPages = Math.ceil(total / Number(limit));

      return response.ok(
        req,
        res,
        {
          messages: messages.reverse(), // Ordre chronologique
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages,
            hasNext: Number(page) < totalPages,
            hasPrev: Number(page) > 1,
          },
        },
        'Messages récupérés avec succès',
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      return response.serverError(req, res, 'Erreur lors de la récupération des messages');
    }
  },
);

export default getConversationMessages;
