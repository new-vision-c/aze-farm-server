import { response } from '@/utils/responses/helpers';

/**
 * @desc    Envoyer un message avec fichier (style WhatsApp)
 * @access  Private
 */
export default async function sendMessageWithFile(req: any, res: any) {
  try {
    const { conversationId } = req.params;
    const { content = '' } = req.body;

    if (!req.file) {
      return response.badRequest(req, res, 'Aucun fichier fourni');
    }

    // Importer les services et Prisma
    const { ConversationUnstructuredDataService } = await import(
      '@/controllers/conversation/services'
    );
    const { PrismaClient } = await import('@prisma/client');

    const unstructuredDataService = new ConversationUnstructuredDataService();
    const prisma = new PrismaClient();

    // 1. Traiter le fichier d'abord
    const fileResult = await unstructuredDataService.processUnstructuredData(
      req.file.buffer,
      req.file.originalname,
      req.user.user_id,
      conversationId,
    );

    if (!fileResult.success) {
      return response.badRequest(
        req,
        res,
        fileResult.error || 'Erreur lors du traitement du fichier',
      );
    }

    // 2. Créer automatiquement un message avec le fichier (style WhatsApp)
    const messageData = {
      conversationId,
      senderId: req.user.user_id,
      content: content || `📎 ${req.file.originalname}`,
      messageType: (fileResult.data?.type?.toUpperCase() || 'TEXT') as
        | 'TEXT'
        | 'IMAGE'
        | 'FILE'
        | 'AUDIO'
        | 'VIDEO',
      attachments: fileResult.data?.url
        ? [fileResult.data.url].filter((url): url is string => url !== undefined)
        : [],
      orderId: null,
    };

    // Créer le message directement avec Prisma
    const message = await prisma.message.create({
      data: {
        conversationId: messageData.conversationId,
        senderId: messageData.senderId,
        content: messageData.content,
        messageType: messageData.messageType,
        attachments: messageData.attachments,
        orderId: messageData.orderId,
      },
      include: {
        sender: {
          select: {
            user_id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return response.created(
      req,
      res,
      {
        message,
        file: fileResult.data,
        conversationId,
      },
      'Message avec fichier envoyé avec succès (style WhatsApp)',
    );
  } catch {
    return response.serverError(req, res, "Erreur lors de l'envoi du message avec fichier");
  }
}
