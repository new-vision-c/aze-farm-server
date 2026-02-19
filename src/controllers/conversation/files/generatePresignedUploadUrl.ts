import { response } from '@/utils/responses/helpers';

/**
 * @desc    Générer une URL présignée pour l'upload de fichiers
 * @access  Private
 */
export default async function generatePresignedUploadUrl(req: any, res: any) {
  try {
    const { filename, conversationId, expiresIn = 3600 } = req.body;

    // Importer le service de données non structurées
    const { ConversationUnstructuredDataService } = await import(
      '@/controllers/conversation/services'
    );
    const unstructuredDataService = new ConversationUnstructuredDataService();

    const result = await unstructuredDataService.generatePresignedUploadUrl(
      filename,
      conversationId,
      expiresIn,
    );

    return response.created(
      req,
      res,
      {
        url: result.url,
        fields: result.fields,
      },
      'URL présignée générée avec succès',
    );
  } catch {
    return response.serverError(req, res, "Erreur lors de la génération de l'URL présignée");
  }
}
