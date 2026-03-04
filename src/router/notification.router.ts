import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';

import { NotificationController } from '@/controllers/notification/notification.controller';
import { isAuthenticated } from '@/middlewares/auth';

const createNotificationRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const notificationController = new NotificationController(prisma);

  // S'abonner aux notifications push
  /**
 * @swagger
 * /api/subscribe:
 *   post:
 *     summary: "POST /api/subscribe"
 *     tags: [Notifications]
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
router.post('/subscribe', isAuthenticated, notificationController.subscribe);

  // Se désabonner des notifications push
  /**
 * @swagger
 * /api/unsubscribe:
 *   delete:
 *     summary: "DELETE /api/unsubscribe"
 *     tags: [Notifications]
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
router.delete('/unsubscribe', isAuthenticated, notificationController.unsubscribe);

  // Récupérer mes notifications
  /**
 * @swagger
 * /api/my-notifications:
 *   get:
 *     summary: "GET /api/my-notifications"
 *     tags: [Notifications]
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
router.get('/my-notifications', isAuthenticated, notificationController.getMyNotifications);

  // Marquer une notification comme lue
  /**
 * @swagger
 * /api/:notificationId/read:
 *   patch:
 *     summary: "PATCH /api/:notificationId/read"
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: "notificationId"
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
router.patch('/:notificationId/read', isAuthenticated, notificationController.markAsRead);

  // Marquer toutes les notifications comme lues
  /**
 * @swagger
 * /api/mark-all-read:
 *   patch:
 *     summary: "PATCH /api/mark-all-read"
 *     tags: [Notifications]
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
router.patch('/mark-all-read', isAuthenticated, notificationController.markAllAsRead);

  // Supprimer une notification
  /**
 * @swagger
 * /api/:notificationId:
 *   delete:
 *     summary: "DELETE /api/:notificationId"
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: "notificationId"
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
router.delete('/:notificationId', isAuthenticated, notificationController.deleteNotification);

  // Envoyer une notification à un utilisateur (admin)
  /**
 * @swagger
 * /api/send:
 *   post:
 *     summary: "POST /api/send"
 *     tags: [Notifications]
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
router.post('/send', isAuthenticated, notificationController.sendNotification);

  // Envoyer une notification promotionnelle à tous (admin)
  /**
 * @swagger
 * /api/broadcast:
 *   post:
 *     summary: "POST /api/broadcast"
 *     tags: [Notifications]
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
router.post('/broadcast', isAuthenticated, notificationController.sendBroadcast);

  return router;
};

export default createNotificationRouter;
