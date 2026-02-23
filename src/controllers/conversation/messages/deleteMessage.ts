import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { asyncHandler, response } from '@/utils/responses/helpers';

//& Supprimer un message
const deleteMessage = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    try {
      const userId = (req as any).user?.userId;
      const { messageId } = req.params;

      if (!userId || !messageId) {
        return response.badRequest(req, res, 'userId et messageId sont requis');
      }

      // Vérifier que le message existe et que l'utilisateur est l'expéditeur
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          senderId: userId,
        },
      });

      if (!message) {
        return response.notFound(req, res, 'Message non trouvé ou accès non autorisé');
      }

      // Supprimer le message
      await prisma.message.delete({
        where: { id: messageId },
      });

      return response.ok(req, res, null, 'Message supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      return response.serverError(req, res, 'Erreur lors de la suppression du message');
    }
  },
);

export default deleteMessage;
