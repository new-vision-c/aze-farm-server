import type { Request, Response } from 'express';

import logger from '@/services/logging/logger';
import { NotificationService, NotificationType } from '@/services/notification/NotificationService';
import { oneSignalService } from '@/services/notification/OneSignalService';
import type { AuthenticatedRequest } from '@/types/express';

/**
 * Contrôleur de notification
 * Gère les abonnements OneSignal et la récupération des notifications
 */
export class NotificationController {
  private notificationService: NotificationService;
  // Stockage des abonnements en mémoire (userId -> playerId)
  private subscriptions: Map<string, string> = new Map();

  constructor(private prisma: any) {
    this.notificationService = new NotificationService(prisma);
  }

  /**
   * S'abonner aux notifications push
   */
  subscribe = async (req: Request, res: Response): Promise<void> => {
    try {
      const { playerId } = req.body;
      const userId = (req as AuthenticatedRequest).user?.user_id;

      if (!playerId || !userId) {
        res.status(400).json({
          success: false,
          message: 'playerId et authentification requis',
        });
        return;
      }

      // Stocker le playerId OneSignal avec l'ID utilisateur
      this.subscriptions.set(userId, playerId);

      // Mettre à jour les tags du joueur OneSignal
      if (oneSignalService.isAvailable()) {
        try {
          await oneSignalService.updatePlayerTags(playerId, {
            userId: userId,
            app: 'azefarm',
          });
        } catch (error) {
          logger.warn('Impossible de mettre à jour les tags OneSignal:', error);
        }
      }

      logger.info(
        `Nouvel abonnement OneSignal enregistré pour l'utilisateur ${userId} (playerId: ${playerId})`,
      );

      res.status(200).json({
        success: true,
        message: 'Abonnement enregistré avec succès',
      });
    } catch (error) {
      logger.error("Erreur lors de l'enregistrement de l'abonnement:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'enregistrement de l'abonnement",
      });
    }
  };

  /**
   * Se désabonner des notifications push
   */
  unsubscribe = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user?.user_id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const playerId = this.subscriptions.get(userId);

      if (!playerId) {
        res.status(404).json({
          success: false,
          message: 'Aucun abonnement trouvé',
        });
        return;
      }

      this.subscriptions.delete(userId);

      logger.info(`Abonnement OneSignal supprimé pour l'utilisateur ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Abonnement supprimé avec succès',
      });
    } catch (error) {
      logger.error("Erreur lors de la suppression de l'abonnement:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de l'abonnement",
      });
    }
  };

  /**
   * Récupérer les notifications de l'utilisateur connecté
   */
  getMyNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user?.user_id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const { limit = '20', offset = '0' } = req.query;

      const notifications = await this.notificationService.getUserNotifications(
        userId,
        parseInt(limit as string, 10),
        parseInt(offset as string, 10),
      );

      const unreadCount = await this.notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            limit: parseInt(limit as string, 10),
            offset: parseInt(offset as string, 10),
          },
        },
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications',
      });
    }
  };

  /**
   * Marquer une notification comme lue
   */
  markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { notificationId } = req.params;
      const userId = (req as AuthenticatedRequest).user?.user_id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const success = await this.notificationService.markAsRead(notificationId, userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Notification marquée comme lue',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Notification non trouvée',
        });
      }
    } catch (error) {
      logger.error('Erreur lors du marquage de la notification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage de la notification',
      });
    }
  };

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user?.user_id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const success = await this.notificationService.markAllAsRead(userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Toutes les notifications marquées comme lues',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erreur lors du marquage des notifications',
        });
      }
    } catch (error) {
      logger.error('Erreur lors du marquage des notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage des notifications',
      });
    }
  };

  /**
   * Supprimer une notification
   */
  deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { notificationId } = req.params;
      const userId = (req as AuthenticatedRequest).user?.user_id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const success = await this.notificationService.deleteNotification(notificationId, userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Notification supprimée',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Notification non trouvée',
        });
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression de la notification:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la notification',
      });
    }
  };

  /**
   * Envoyer une notification à un utilisateur spécifique (admin seulement)
   */
  sendNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, title, message, type, data } = req.body;
      const playerId = this.subscriptions.get(userId);

      const success = await this.notificationService.sendNotification({
        userId,
        title,
        message,
        type: type as NotificationType,
        data,
        playerId,
      });

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Notification envoyée avec succès',
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Erreur lors de l'envoi de la notification",
        });
      }
    } catch (error) {
      logger.error("Erreur lors de l'envoi de la notification:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi de la notification",
      });
    }
  };

  /**
   * Envoyer une notification promotionnelle à tous les utilisateurs (admin seulement)
   */
  sendBroadcast = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, message } = req.body;

      const success = await this.notificationService.sendPromotionNotification(title, message);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Notification promotionnelle envoyée avec succès',
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Erreur lors de l'envoi de la notification",
        });
      }
    } catch (error) {
      logger.error("Erreur lors de l'envoi de la notification broadcast:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi de la notification",
      });
    }
  };

  /**
   * Récupérer le playerId d'un utilisateur (pour usage interne)
   */
  getPlayerId(userId: string): string | undefined {
    return this.subscriptions.get(userId);
  }
}
