import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { asyncHandler, response } from '@/utils/responses/helpers';

//& Marquer un message comme lu
const markMessageAsRead = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    try {
      const userId = (req as any).user?.userId;
      const { messageId } = req.params;

      if (!userId || !messageId) {
        return response.badRequest(req, res, 'userId et messageId sont requis');
      }

      // Vérifier que le message existe et que l'utilisateur y a accès
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          conversation: {
            OR: [{ consumerId: userId }, { farm: { farmerId: userId } }],
          },
        },
      });

      if (!message) {
        return response.notFound(req, res, 'Message non trouvé ou accès non autorisé');
      }

      // Ne pas marquer comme lu si l'utilisateur est l'expéditeur
      if (message.senderId === userId) {
        return response.badRequest(req, res, 'Impossible de marquer son propre message comme lu');
      }

      // Marquer le message comme lu
      await prisma.message.update({
        where: { id: messageId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return response.ok(req, res, null, 'Message marqué comme lu');
    } catch (error) {
      console.error('Erreur lors du marquage du message comme lu:', error);
      return response.serverError(req, res, 'Erreur lors du marquage du message comme lu');
    }
  },
);

export default markMessageAsRead;
