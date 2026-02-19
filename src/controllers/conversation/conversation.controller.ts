// Import des fonctions de conversations
import createOrGetConversation from './conversations/createOrGetConversation';
import getUserConversations from './conversations/getUserConversations';
import deleteConversationFile from './files/deleteConversationFile';
// Import des fonctions de fichiers
import generatePresignedUploadUrl from './files/generatePresignedUploadUrl';
import sendMessageWithFile from './files/sendMessageWithFile';
import uploadFileToConversation from './files/uploadFileToConversation';
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

  // ***************************************************************************************************************************************************************************************************************************************
  //* FILES ******************************************************************************************
  // ***************************************************************************************************************************************************************************************************************************************
  generatePresignedUploadUrl,
  uploadFileToConversation,
  sendMessageWithFile,
  deleteConversationFile,
};

export default conversation_controller;
