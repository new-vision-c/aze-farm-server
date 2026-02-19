// Types d'utilisateurs pour le système de conversation (spécifique Consumer-Farmer)
export enum UserRole {
  CONSUMER = 'CONSUMER',
  FARMER = 'FARMER',
  ADMIN = 'ADMIN',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  BLOCKED = 'BLOCKED',
}

// Interface pour les conversations entre Consumer et Farm
export interface Conversation {
  id: string;
  consumerId: string;
  farmId: string; // Obligatoire, la ferme est le participant
  status: ConversationStatus;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  consumer?: {
    id: string;
    fullname: string;
    avatar_url?: string;
    role: UserRole.CONSUMER;
  };
  farm?: {
    id: string;
    name: string;
    image_url?: string;
    description?: string;
    farmer?: {
      id: string;
      fullname: string;
      avatar_url?: string;
    };
  };
  lastMessage?: {
    id: string;
    content: string;
    messageType: MessageType;
    senderId: string;
    senderRole: UserRole;
    createdAt: Date;
  };
  unreadCount?: number; // Nombre de messages non lus pour l'utilisateur courant
}

// Interface pour les messages
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  content: string;
  messageType: MessageType;
  attachments: string[];
  isRead: boolean;
  readAt?: Date;
  orderId?: string;
  farmId?: string;
  createdAt: Date;
  updatedAt: Date;
  sender?: {
    id: string;
    fullname: string;
    avatar_url?: string;
    role: UserRole;
  };
}

// Interface pour la création de conversation (Consumer vers Farm)
export interface CreateConversationData {
  farmId: string; // Obligatoire, la ferme concernée
  initialMessage?: string;
  orderId?: string; // Optionnel, si lié à une commande
}

// Interface pour l'envoi de message
export interface SendMessageData {
  conversationId: string;
  content: string;
  messageType?: MessageType;
  attachments?: string[];
  orderId?: string;
  farmId?: string;
}

// Interface pour la réponse paginée
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Interface pour l'utilisateur authentifié étendu
export interface AuthenticatedUser {
  id: string;
  email: string;
  fullname: string;
  role: UserRole;
  avatar_url?: string;
  is_verified: boolean;
  is_active: boolean;
}
