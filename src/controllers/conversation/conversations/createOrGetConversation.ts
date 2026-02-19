import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { conversationI18n } from '../services';

//& Créer ou récupérer une conversation entre un consumer et une ferme
const createOrGetConversation = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    try {
      const userId = (req as any).user?.id;
      const { farmId, initialMessage, orderId } = req.body;

      if (!userId || !farmId) {
        return response.badRequest(
          req,
          res,
          conversationI18n.translate('conversation.errors.consumer_farm_required'),
        );
      }

      // Vérifier que la ferme existe
      const farm = await prisma.farm.findUnique({
        where: { id: farmId },
        include: {
          farmer: {
            select: {
              user_id: true,
              fullname: true,
              avatar_url: true,
            },
          },
        },
      });

      if (!farm) {
        return response.notFound(
          req,
          res,
          conversationI18n.translate('conversation.errors.farm_not_found'),
        );
      }

      // Vérifier si une conversation existe déjà
      let conversation = await prisma.conversation.findFirst({
        where: {
          consumerId: userId,
          farmId,
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
      });

      if (!conversation) {
        // Créer une nouvelle conversation
        conversation = await prisma.conversation.create({
          data: {
            consumerId: userId,
            farmId,
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
        });

        // Si un message initial est fourni, l'envoyer
        if (initialMessage) {
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              senderId: userId,
              content: initialMessage,
              messageType: 'TEXT',
              orderId,
            },
          });

          // Mettre à jour le timestamp du dernier message
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { lastMessageAt: new Date() },
          });
        }
      }

      return response.ok(
        req,
        res,
        { conversation },
        conversationI18n.translate('conversation.retrieved'),
      );
    } catch (error) {
      console.error('Erreur lors de la création/récupération de la conversation:', error);
      return response.serverError(
        req,
        res,
        conversationI18n.translate('conversation.errors.creation_failed'),
      );
    }
  },
);

export default createOrGetConversation;
