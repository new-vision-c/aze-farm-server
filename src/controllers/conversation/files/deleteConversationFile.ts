import { response } from '@/utils/responses/helpers';

/**
 * @desc    Supprimer un fichier d'une conversation
 * @access  Private
 */
export default async function deleteConversationFile(req: any, res: any) {
  try {
    const { publicId } = req.body;

    // Importer le service de données non structurées
    const { ConversationUnstructuredDataService } = await import(
      '@/controllers/conversation/services'
    );
    const unstructuredDataService = new ConversationUnstructuredDataService();

    const deleted = await unstructuredDataService.deleteConversationFile(
      publicId,
      req.user.user_id,
    );

    return response.success(
      req,
      res,
      {
        deleted,
      },
      deleted ? 'Fichier supprimé avec succès' : 'Fichier non trouvé',
    );
  } catch {
    return response.serverError(req, res, 'Erreur lors de la suppression du fichier');
  }
}
