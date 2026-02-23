// English translations for conversation module
export const en = {
  // Success messages
  'conversation.created': 'Conversation created successfully',
  'conversation.retrieved': 'Conversation retrieved successfully',
  'conversation.list.retrieved': 'Conversations retrieved successfully',

  // Messages
  'message.sent': 'Message sent successfully',
  'message.retrieved': 'Messages retrieved successfully',
  'message.marked_read': 'Message marked as read',
  'message.deleted': 'Message deleted successfully',
  'message.unread_count': 'Unread messages count retrieved successfully',

  // Validation errors
  'conversation.errors.consumer_farm_required': 'consumerId and farmId are required',
  'conversation.errors.conversation_not_found': 'Conversation not found or unauthorized access',
  'conversation.errors.farm_not_found': 'Farm not found',
  'conversation.errors.user_not_authenticated': 'User not authenticated',

  'message.errors.conversation_content_required': 'userId, conversationId and content are required',
  'message.errors.conversation_id_required': 'userId and messageId are required',
  'message.errors.message_not_found': 'Message not found or unauthorized access',
  'message.errors.cannot_mark_own_read': 'Cannot mark own message as read',
  'message.errors.content_required': 'Message content is required',
  'message.errors.content_too_long': 'Message must be between 1 and 2000 characters',
  'message.errors.content_too_short': 'Message must be between 1 and 1000 characters',
  'message.errors.invalid_message_type': 'Invalid message type',
  'message.errors.invalid_attachments': 'Attachments must be an array',
  'message.errors.invalid_attachment_url': 'Each attachment must be a valid URL',

  // General errors
  'conversation.errors.creation_failed': 'Error creating/retrieving conversation',
  'conversation.errors.retrieval_failed': 'Error retrieving conversations',
  'message.errors.send_failed': 'Error sending message',
  'message.errors.retrieval_failed': 'Error retrieving messages',
  'message.errors.mark_read_failed': 'Error marking message as read',
  'message.errors.delete_failed': 'Error deleting message',
  'message.errors.unread_count_failed': 'Error retrieving unread messages count',

  // Notifications
  'notification.new_message': 'New message from {{senderName}}',
  'notification.message_preview': '{{preview}}',
  'notification.send_failed': 'Error sending push notification',

  // System messages
  'conversation.system.new_message': 'New message',
  'conversation.system.messages_unread': '{{count}} unread message(s)',
  'conversation.system.one_message_unread': '1 unread message',
  'conversation.system.no_messages_unread': 'No unread messages',

  // Message types
  'message.type.text': 'Text',
  'message.type.image': 'Image',
  'message.type.file': 'File',
  'message.type.audio': 'Audio',
  'message.type.video': 'Video',

  // Conversation status
  'conversation.status.active': 'Active',
  'conversation.status.archived': 'Archived',
  'conversation.status.blocked': 'Blocked',
};
