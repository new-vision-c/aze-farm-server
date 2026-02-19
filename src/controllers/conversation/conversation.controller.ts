// Import des fonctions de conversations
import createOrGetConversation from './conversations/createOrGetConversation';
import getUserConversations from './conversations/getUserConversations';
import deleteMessage from './messages/deleteMessage';
import getConversationMessages from './messages/getConversationMessages';
import getUnreadCount from './messages/getUnreadCount';
import markMessageAsRead from './messages/markMessageAsRead';
// Import des fonctions de messages
import sendMessage from './messages/sendMessage';

const conversation_controller = {
  // ***************************************************************************************************************************************************************************************************************************************
  //* CONVERSATIONS ******************************************************************************************
  // ***************************************************************************************************************************************************************************************************************************************
  createOrGetConversation,
  getUserConversations,

  // ***************************************************************************************************************************************************************************************************************************************
  //* MESSAGES ******************************************************************************************
  // ***************************************************************************************************************************************************************************************************************************************
  sendMessage,
  getConversationMessages,
  markMessageAsRead,
  deleteMessage,
  getUnreadCount,
};

export default conversation_controller;
