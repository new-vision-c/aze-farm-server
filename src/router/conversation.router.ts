import { Router } from 'express';
import { body, param, query } from 'express-validator';
import multer, { type FileFilterCallback } from 'multer';

import {
  createOrGetConversation,
  deleteConversationFile,
  deleteMessage,
  generatePresignedUploadUrl,
  getConversationMessages,
  getUnreadCount,
  getUserConversations,
  markMessageAsRead,
  sendMessage,
  sendMessageWithFile,
  uploadFileToConversation,
} from '@/controllers/conversation';
import { isAuthenticated } from '@/middlewares/auth';
import { validateRequest } from '@/middlewares/validator.middleware';
import type { AuthenticatedRequest } from '@/types/express';

const router = Router();

// Configuration Multer pour l'upload de fichiers
const _upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req: AuthenticatedRequest, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Types MIME autorisés
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'application/pdf',
      'text/plain',
      'text/csv',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  },
});

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
    body('orderId')
      .optional()
      .custom((value) => {
        if (value === null || value === undefined) return true;
        return /^[0-9a-fA-F]{24}$/.test(value);
      })
      .withMessage("L'ID de la commande est invalide"),
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
/**
 * @swagger
 * /api/unread-count:
 *   get:
 *     summary: "GET /api/unread-count"
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Opération réussie"
 *                 data:
 *                   type: object
 *                   description: "Données de réponse"
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non authentifié"
 *       500:
 *         description: "Erreur serveur"
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
    body('orderId')
      .optional()
      .custom((value) => {
        if (value === null || value === undefined) return true;
        return /^[0-9a-fA-F]{24}$/.test(value);
      })
      .withMessage("L'ID de la commande est invalide"),
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

/**
 * @route   POST /api/conversations/upload-url
 * @desc    Générer une URL présignée pour l'upload de fichiers
 * @access  Private
 */
router.post(
  '/upload-url',
  [
    body('filename')
      .notEmpty()
      .withMessage('Le nom du fichier est requis')
      .isLength({ min: 1, max: 255 })
      .withMessage('Le nom du fichier doit contenir entre 1 et 255 caractères'),
    body('conversationId')
      .notEmpty()
      .withMessage("L'ID de la conversation est requis")
      .isMongoId()
      .withMessage("L'ID de la conversation est invalide"),
    body('expiresIn')
      .optional()
      .isInt({ min: 60, max: 3600 })
      .withMessage("La durée d'expiration doit être entre 60 et 3600 secondes"),
  ],
  validateRequest,
  generatePresignedUploadUrl,
);

/**
 * @route   POST /api/conversations/upload
 * @desc    Upload direct de fichiers dans une conversation
 * @access  Private
 */
router.post(
  '/upload',
  _upload.single('file'),
  [
    body('conversationId')
      .notEmpty()
      .withMessage("L'ID de la conversation est requis")
      .isMongoId()
      .withMessage("L'ID de la conversation est invalide"),
  ],
  validateRequest,
  uploadFileToConversation,
);

/**
 * @route   POST /api/conversations/:conversationId/messages-with-file
 * @desc    Envoyer un message avec fichier (style WhatsApp)
 * @access  Private
 */
router.post(
  '/:conversationId/messages-with-file',
  _upload.single('file'),
  [
    param('conversationId').isMongoId().withMessage("L'ID de la conversation est invalide"),
    body('content')
      .optional()
      .isString()
      .withMessage('Le contenu doit être une chaîne de caractères')
      .isLength({ max: 2000 })
      .withMessage('Le contenu ne peut pas dépasser 2000 caractères'),
  ],
  validateRequest,
  sendMessageWithFile,
);

/**
 * @route   DELETE /api/conversations/files
 * @desc    Supprimer un fichier d'une conversation
 * @access  Private
 */
router.delete(
  '/files',
  [
    body('publicId')
      .notEmpty()
      .withMessage("L'identifiant public du fichier est requis")
      .isString()
      .withMessage("L'identifiant public doit être une chaîne de caractères"),
  ],
  validateRequest,
  deleteConversationFile,
);

export default router;
