import type { NotificationType } from '@prisma/client';
import type { Request, Response } from 'express';

import { I18nService } from '@/services/I18nService';
import logger from '@/services/logging/logger';
import { NotificationService } from '@/services/notification/NotificationService';
import { oneSignalService } from '@/services/notification/OneSignalService';
import type { AuthenticatedRequest } from '@/types/express';

// Instance du service i18n
const i18n = new I18nService();

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
    const lang = i18n.detectLanguage(req.headers['accept-language']);
    try {
      const { playerId } = req.body;
      const userId = (req as AuthenticatedRequest).user?.user_id;

      if (!playerId || !userId) {
        res.status(400).json({
          success: false,
          message: i18n.translate('notifications.playerid_required', lang),
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
        message: i18n.translate('notifications.subscription_saved', lang),
      });
    } catch (error) {
      logger.error("Erreur lors de l'enregistrement de l'abonnement:", error);
      res.status(500).json({
        success: false,
        message: i18n.translate('notifications.subscription_error', lang),
      });
    }
  };

  /**
   * Se désabonner des notifications push
   */
  unsubscribe = async (req: Request, res: Response): Promise<void> => {
    const lang = i18n.detectLanguage(req.headers['accept-language']);
    try {
      const userId = (req as AuthenticatedRequest).user?.user_id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: i18n.translate('auth.user_not_authenticated', lang),
        });
        return;
      }

      const playerId = this.subscriptions.get(userId);

      if (!playerId) {
        res.status(404).json({
          success: false,
          message: i18n.translate('notifications.subscription_not_found', lang),
        });
        return;
      }

      this.subscriptions.delete(userId);

      logger.info(`Abonnement OneSignal supprimé pour l'utilisateur ${userId}`);

      res.status(200).json({
        success: true,
        message: i18n.translate('notifications.subscription_removed', lang),
      });
    } catch (error) {
      logger.error("Erreur lors de la suppression de l'abonnement:", error);
      res.status(500).json({
        success: false,
        message: i18n.translate('notifications.unsubscription_error', lang),
      });
    }
  };

  /**
   * Récupérer les notifications de l'utilisateur connecté
   */
  getMyNotifications = async (req: Request, res: Response): Promise<void> => {
    const lang = i18n.detectLanguage(req.headers['accept-language']);
    try {
      const userId = (req as AuthenticatedRequest).user?.user_id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: i18n.translate('auth.user_not_authenticated', lang),
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
        message: i18n.translate('notifications.retrieve_error', lang),
      });
    }
  };

  /**
   * Marquer une notification comme lue
   */
  markAsRead = async (req: Request, res: Response): Promise<void> => {
    const lang = i18n.detectLanguage(req.headers['accept-language']);
    try {
      const { notificationId } = req.params;
      const userId = (req as AuthenticatedRequest).user?.user_id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: i18n.translate('auth.user_not_authenticated', lang),
        });
        return;
      }

      const success = await this.notificationService.markAsRead(notificationId, userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: i18n.translate('notifications.marked_read', lang),
        });
      } else {
        res.status(404).json({
          success: false,
          message: i18n.translate('notifications.not_found', lang),
        });
      }
    } catch (error) {
      logger.error('Erreur lors du marquage de la notification:', error);
      res.status(500).json({
        success: false,
        message: i18n.translate('notifications.mark_error', lang),
      });
    }
  };

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    const lang = i18n.detectLanguage(req.headers['accept-language']);
    try {
      const userId = (req as AuthenticatedRequest).user?.user_id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: i18n.translate('auth.user_not_authenticated', lang),
        });
        return;
      }

      const success = await this.notificationService.markAllAsRead(userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: i18n.translate('notifications.marked_all_read', lang),
        });
      } else {
        res.status(500).json({
          success: false,
          message: i18n.translate('notifications.mark_all_error', lang),
        });
      }
    } catch (error) {
      logger.error('Erreur lors du marquage des notifications:', error);
      res.status(500).json({
        success: false,
        message: i18n.translate('notifications.mark_all_error', lang),
      });
    }
  };

  /**
   * Supprimer une notification
   */
  deleteNotification = async (req: Request, res: Response): Promise<void> => {
    const lang = i18n.detectLanguage(req.headers['accept-language']);
    try {
      const { notificationId } = req.params;
      const userId = (req as AuthenticatedRequest).user?.user_id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: i18n.translate('auth.user_not_authenticated', lang),
        });
        return;
      }

      const success = await this.notificationService.deleteNotification(notificationId, userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: i18n.translate('notifications.deleted', lang),
        });
      } else {
        res.status(404).json({
          success: false,
          message: i18n.translate('notifications.not_found', lang),
        });
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression de la notification:', error);
      res.status(500).json({
        success: false,
        message: i18n.translate('notifications.delete_error', lang),
      });
    }
  };

  /**
   * Envoyer une notification à un utilisateur spécifique (admin seulement)
   */
  sendNotification = async (req: Request, res: Response): Promise<void> => {
    const lang = i18n.detectLanguage(req.headers['accept-language']);
    try {
      const { userId, title, message, type } = req.body;
      const playerId = this.subscriptions.get(userId);

      const success = await this.notificationService.sendNotification({
        userId,
        title,
        message,
        type: type as NotificationType,
        playerId,
      });

      if (success) {
        res.status(200).json({
          success: true,
          message: i18n.translate('notifications.sent', lang),
        });
      } else {
        res.status(500).json({
          success: false,
          message: i18n.translate('notifications.send_error', lang),
        });
      }
    } catch (error) {
      logger.error("Erreur lors de l'envoi de la notification:", error);
      res.status(500).json({
        success: false,
        message: i18n.translate('notifications.send_error', lang),
      });
    }
  };

  /**
   * Envoyer une notification promotionnelle à tous les utilisateurs (admin seulement)
   */
  sendBroadcast = async (req: Request, res: Response): Promise<void> => {
    const lang = i18n.detectLanguage(req.headers['accept-language']);
    try {
      const { title, message } = req.body;

      const success = await this.notificationService.sendPromotionNotification(title, message);

      if (success) {
        res.status(200).json({
          success: true,
          message: i18n.translate('notifications.broadcast_sent', lang),
        });
      } else {
        res.status(500).json({
          success: false,
          message: i18n.translate('notifications.broadcast_error', lang),
        });
      }
    } catch (error) {
      logger.error("Erreur lors de l'envoi de la notification broadcast:", error);
      res.status(500).json({
        success: false,
        message: i18n.translate('notifications.broadcast_error', lang),
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
