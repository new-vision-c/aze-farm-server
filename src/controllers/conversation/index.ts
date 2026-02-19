// Export individuel des fonctions pour utilisation dans les routes
import conversation_controller from './conversation.controller';

// Export du contrôleur de conversation refactorisé
export { default as conversation_controller } from './conversation.controller';

export const {
  createOrGetConversation,
  getUserConversations,
  sendMessage,
  getConversationMessages,
  markMessageAsRead,
  deleteMessage,
  getUnreadCount,
} = conversation_controller;
