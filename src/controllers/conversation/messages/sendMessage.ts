import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { ConversationSecurityService, conversationI18n } from '../services';

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

      // Sécurité: Valider et nettoyer le contenu du message (Protection XSS)
      let sanitizedContent = content;
      if (content?.trim()) {
        // Vérifier si le contenu est suspect
        if (ConversationSecurityService.isSuspiciousContent(content)) {
          console.warn(
            ` Contenu suspect détecté de l'utilisateur ${userId}:`,
            content.substring(0, 100),
          );
        }

        // Sanitization du contenu
        sanitizedContent = ConversationSecurityService.sanitizeMessageContent(content);
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

      // Sécurité: Valider les pièces jointes
      let sanitizedAttachments = [];
      if (attachments && Array.isArray(attachments)) {
        sanitizedAttachments = attachments
          .filter((url) => ConversationSecurityService.isValidId(url, 'message'))
          .slice(0, 5); // Limiter à 5 pièces jointes max
      }

      // Créer le message avec contenu sécurisé
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: sanitizedContent,
          messageType,
          attachments: sanitizedAttachments,
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

      // Envoyer notification en temps réel via WebSocket
      // TODO: Intégrer WebSocketService avec métadonnées sécurisées
      const _secureMetadata = ConversationSecurityService.createSecureMetadata(
        message.id,
        conversationId,
        'new_message',
      );

      // Envoyer notification push sécurisée au destinataire
      const recipientId =
        conversation.consumerId === userId ? conversation.farmId : conversation.consumerId;

      // TODO: Intégrer NotificationService avec payload sécurisé
      console.log(`Notification sécurisée préparée pour l'utilisateur ${recipientId}`);

      return response.created(
        req,
        res,
        {
          message: {
            ...message,
            content: sanitizedContent, // Retourner le contenu sécurisé
          },
        },
        conversationI18n.translate('message.sent'),
      );
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
