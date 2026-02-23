import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';

import { NotificationController } from '@/controllers/notification/notification.controller';
import { isAuthenticated } from '@/middlewares/auth';

const createNotificationRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const notificationController = new NotificationController(prisma);

  // S'abonner aux notifications push
  router.post('/subscribe', isAuthenticated, notificationController.subscribe);

  // Se désabonner des notifications push
  router.delete('/unsubscribe', isAuthenticated, notificationController.unsubscribe);

  // Récupérer mes notifications
  router.get('/my-notifications', isAuthenticated, notificationController.getMyNotifications);

  // Marquer une notification comme lue
  router.patch('/:notificationId/read', isAuthenticated, notificationController.markAsRead);

  // Marquer toutes les notifications comme lues
  router.patch('/mark-all-read', isAuthenticated, notificationController.markAllAsRead);

  // Supprimer une notification
  router.delete('/:notificationId', isAuthenticated, notificationController.deleteNotification);

  // Envoyer une notification à un utilisateur (admin)
  router.post('/send', isAuthenticated, notificationController.sendNotification);

  // Envoyer une notification promotionnelle à tous (admin)
  router.post('/broadcast', isAuthenticated, notificationController.sendBroadcast);

  return router;
};

export default createNotificationRouter;
