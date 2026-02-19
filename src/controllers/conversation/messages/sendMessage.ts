import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { conversationI18n } from '../services';

//& Envoyer un message dans une conversation
const sendMessage = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    try {
      const userId = (req as any).user?.id;
      const { conversationId, content, messageType = 'TEXT', attachments, orderId } = req.body;

      if (!userId || !conversationId || !content) {
        return response.badRequest(
          req,
          res,
          conversationI18n.translate('message.errors.conversation_content_required'),
        );
      }

      // Vérifier que l'utilisateur a accès à cette conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [{ consumerId: userId }, { farm: { farmerId: userId } }],
        },
      });

      if (!conversation) {
        return response.notFound(
          req,
          res,
          conversationI18n.translate('conversation.errors.conversation_not_found'),
        );
      }

      // Créer le message
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content,
          messageType,
          attachments: attachments || [],
          orderId,
        },
        include: {
          sender: {
            select: {
              user_id: true,
              fullname: true,
              avatar_url: true,
            },
          },
        },
      });

      // Mettre à jour le timestamp du dernier message dans la conversation
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      // TODO: Envoyer notification en temps réel via WebSocket
      // TODO: Envoyer notification push au destinataire

      return response.created(req, res, { message }, conversationI18n.translate('message.sent'));
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      return response.serverError(
        req,
        res,
        conversationI18n.translate('message.errors.send_failed'),
      );
    }
  },
);

export default sendMessage;
