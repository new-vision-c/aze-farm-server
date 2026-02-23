// Traductions françaises pour le module conversation
export const fr = {
  // Messages de succès
  'conversation.created': 'Conversation créée avec succès',
  'conversation.retrieved': 'Conversation récupérée avec succès',
  'conversation.list.retrieved': 'Conversations récupérées avec succès',

  // Messages
  'message.sent': 'Message envoyé avec succès',
  'message.retrieved': 'Messages récupérés avec succès',
  'message.marked_read': 'Message marqué comme lu',
  'message.deleted': 'Message supprimé avec succès',
  'message.unread_count': 'Nombre de messages non lus récupéré avec succès',

  // Erreurs de validation
  'conversation.errors.consumer_farm_required': 'consumerId et farmId sont requis',
  'conversation.errors.conversation_not_found': 'Conversation non trouvée ou accès non autorisé',
  'conversation.errors.farm_not_found': 'Ferme non trouvée',
  'conversation.errors.user_not_authenticated': 'Utilisateur non authentifié',

  'message.errors.conversation_content_required': 'userId, conversationId et content sont requis',
  'message.errors.conversation_id_required': 'userId et messageId sont requis',
  'message.errors.message_not_found': 'Message non trouvé ou accès non autorisé',
  'message.errors.cannot_mark_own_read': 'Impossible de marquer son propre message comme lu',
  'message.errors.content_required': 'Le contenu du message est requis',
  'message.errors.content_too_long': 'Le message doit contenir entre 1 et 2000 caractères',
  'message.errors.content_too_short': 'Le message doit contenir entre 1 et 1000 caractères',
  'message.errors.invalid_message_type': 'Le type de message est invalide',
  'message.errors.invalid_attachments': 'Les pièces jointes doivent être un tableau',
  'message.errors.invalid_attachment_url': 'Chaque pièce jointe doit être une URL valide',

  // Erreurs générales
  'conversation.errors.creation_failed':
    'Erreur lors de la création/récupération de la conversation',
  'conversation.errors.retrieval_failed': 'Erreur lors de la récupération des conversations',
  'message.errors.send_failed': "Erreur lors de l'envoi du message",
  'message.errors.retrieval_failed': 'Erreur lors de la récupération des messages',
  'message.errors.mark_read_failed': 'Erreur lors du marquage du message comme lu',
  'message.errors.delete_failed': 'Erreur lors de la suppression du message',
  'message.errors.unread_count_failed':
    'Erreur lors de la récupération du nombre de messages non lus',

  // Validation des IDs
  'validation.errors.invalid_farm_id': "L'ID de la ferme est invalide",
  'validation.errors.invalid_conversation_id': "L'ID de la conversation est invalide",
  'validation.errors.invalid_message_id': "L'ID du message est invalide",
  'validation.errors.invalid_order_id': "L'ID de la commande est invalide",
  'validation.errors.invalid_page': 'Le numéro de page doit être un entier positif',
  'validation.errors.invalid_limit': 'La limite doit être un entier entre 1 et 50',

  // Notifications
  'notification.new_message': 'Nouveau message de {{senderName}}',
  'notification.message_preview': '{{preview}}',
  'notification.send_failed': "Erreur lors de l'envoi de la notification push",

  // Messages système
  'conversation.system.new_message': 'Nouveau message',
  'conversation.system.messages_unread': '{{count}} message(s) non lu(s)',
  'conversation.system.one_message_unread': '1 message non lu',
  'conversation.system.no_messages_unread': 'Aucun message non lu',

  // Types de messages
  'message.type.text': 'Texte',
  'message.type.image': 'Image',
  'message.type.file': 'Fichier',
  'message.type.audio': 'Audio',
  'message.type.video': 'Vidéo',

  // Status de conversation
  'conversation.status.active': 'Active',
  'conversation.status.archived': 'Archivée',
  'conversation.status.blocked': 'Bloquée',
};
