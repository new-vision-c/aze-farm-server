import { Router } from 'express';
import { body, param, query } from 'express-validator';

import {
  createOrGetConversation,
  deleteMessage,
  getConversationMessages,
  getUnreadCount,
  getUserConversations,
  markMessageAsRead,
  sendMessage,
} from '@/controllers/conversation';
import { isAuthenticated } from '@/middlewares/auth';
import { validateRequest } from '@/middlewares/validator.middleware';

const router = Router();

// Middleware d'authentification pour toutes les routes
router.use(isAuthenticated);

/**
 * @route   POST /api/conversations
 * @desc    Créer ou récupérer une conversation entre un consumer et une ferme
 * @access  Private (Consumer uniquement)
 */
router.post(
  '/',
  [
    body('farmId')
      .notEmpty()
      .withMessage("L'ID de la ferme est requis")
      .isMongoId()
      .withMessage("L'ID de la ferme est invalide"),
    body('initialMessage')
      .optional()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Le message doit contenir entre 1 et 1000 caractères'),
    body('orderId').optional().isMongoId().withMessage("L'ID de la commande est invalide"),
  ],
  validateRequest,
  createOrGetConversation,
);

/**
 * @route   GET /api/conversations
 * @desc    Récupérer toutes les conversations de l'utilisateur
 * @access  Private
 */
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Le numéro de page doit être un entier positif'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('La limite doit être un entier entre 1 et 50'),
  ],
  validateRequest,
  getUserConversations,
);

/**
 * @route   GET /api/conversations/unread-count
 * @desc    Récupérer le nombre de messages non lus
 * @access  Private
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   GET /api/conversations/:conversationId/messages
 * @desc    Récupérer les messages d'une conversation
 * @access  Private
 */
router.get(
  '/:conversationId/messages',
  [
    param('conversationId').isMongoId().withMessage("L'ID de la conversation est invalide"),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Le numéro de page doit être un entier positif'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('La limite doit être un entier entre 1 et 50'),
  ],
  validateRequest,
  getConversationMessages,
);

/**
 * @route   POST /api/conversations/:conversationId/messages
 * @desc    Envoyer un message dans une conversation
 * @access  Private
 */
router.post(
  '/:conversationId/messages',
  [
    param('conversationId').isMongoId().withMessage("L'ID de la conversation est invalide"),
    body('content')
      .notEmpty()
      .withMessage('Le contenu du message est requis')
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Le message doit contenir entre 1 et 2000 caractères'),
    body('messageType')
      .optional()
      .isIn(['TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO'])
      .withMessage('Le type de message est invalide'),
    body('attachments')
      .optional()
      .isArray()
      .withMessage('Les pièces jointes doivent être un tableau'),
    body('attachments.*')
      .optional()
      .isURL()
      .withMessage('Chaque pièce jointe doit être une URL valide'),
    body('orderId').optional().isMongoId().withMessage("L'ID de la commande est invalide"),
  ],
  validateRequest,
  sendMessage,
);

/**
 * @route   PATCH /api/conversations/messages/:messageId/read
 * @desc    Marquer un message comme lu
 * @access  Private
 */
router.patch(
  '/messages/:messageId/read',
  [param('messageId').isMongoId().withMessage("L'ID du message est invalide")],
  validateRequest,
  markMessageAsRead,
);

/**
 * @route   DELETE /api/conversations/messages/:messageId
 * @desc    Supprimer un message
 * @access  Private (uniquement l'expéditeur du message)
 */
router.delete(
  '/messages/:messageId',
  [param('messageId').isMongoId().withMessage("L'ID du message est invalide")],
  validateRequest,
  deleteMessage,
);

export default router;
