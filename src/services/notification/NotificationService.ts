import type { NotificationType, PrismaClient } from '@prisma/client';

import logger from '@/services/logging/logger';

import { type OneSignalNotificationPayload, oneSignalService } from './OneSignalService';

/**
 * Types connexes pour les notifications (correspond à NotificationRelatedType dans Prisma)
 */
export enum NotificationRelatedType {
  CART = 'CART',
  ORDER = 'ORDER',
  PRODUCT = 'PRODUCT',
  FARM = 'FARM',
  MESSAGE = 'MESSAGE',
}

/**
 * Interface pour les données de notification
 */
export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string;
  relatedType?: NotificationRelatedType;
  playerId?: string;
}

/**
 * Service de notification
 * Gère l'envoi de notifications via OneSignal et l'enregistrement en base de données
 */
export class NotificationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Envoie une notification à un utilisateur spécifique
   */
  async sendNotification(data: NotificationData): Promise<boolean> {
    try {
      // Enregistrer la notification en base de données
      await this.prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          relatedId: data.relatedId,
          relatedType: data.relatedType,
          isRead: false,
        },
      });

      logger.info(`Notification enregistrée pour l'utilisateur ${data.userId}: ${data.title}`);

      // Si un playerId est fourni, envoyer aussi via OneSignal
      if (data.playerId && oneSignalService.isAvailable()) {
        const payload: OneSignalNotificationPayload = {
          title: data.title,
          body: data.message,
          data: {
            relatedId: data.relatedId,
            relatedType: data.relatedType,
            type: data.type,
            userId: data.userId,
          },
        };

        await oneSignalService.sendNotification(data.playerId, payload);
        logger.info(
          `Notification push envoyée à l'utilisateur ${data.userId} (playerId: ${data.playerId})`,
        );
      }

      return true;
    } catch (error) {
      logger.error(
        `Erreur lors de l'envoi de la notification à l'utilisateur ${data.userId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Envoie une notification à plusieurs utilisateurs
   */
  async sendBulkNotifications(
    notifications: NotificationData[],
  ): Promise<{ success: string[]; failed: string[] }> {
    const results = await Promise.all(
      notifications.map(async (notification) => ({
        userId: notification.userId,
        success: await this.sendNotification(notification),
      })),
    );

    return {
      success: results.filter((r) => r.success).map((r) => r.userId),
      failed: results.filter((r) => !r.success).map((r) => r.userId),
    };
  }

  /**
   * Envoie une notification de paiement reçu
   */
  async sendPaymentNotification(
    userId: string,
    amount: number,
    orderId: string,
    playerId?: string,
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      title: 'Paiement reçu',
      message: `Votre paiement de ${amount} FCFA pour la commande ${orderId} a été confirmé.`,
      type: 'ORDER_STATUS' as NotificationType,
      relatedId: orderId,
      relatedType: NotificationRelatedType.ORDER,
      playerId,
    });
  }

  /**
   * Envoie une notification de nouvelle commande au fermier
   */
  async sendNewOrderNotification(
    farmerId: string,
    orderId: string,
    totalAmount: number,
    playerId?: string,
  ): Promise<boolean> {
    return this.sendNotification({
      userId: farmerId,
      title: 'Nouvelle commande',
      message: `Vous avez reçu une nouvelle commande de ${totalAmount} FCFA.`,
      type: 'ORDER_STATUS' as NotificationType,
      relatedId: orderId,
      relatedType: NotificationRelatedType.ORDER,
      playerId,
    });
  }

  /**
   * Envoie une notification de changement de statut de commande
   */
  async sendOrderStatusNotification(
    userId: string,
    orderId: string,
    status: string,
    playerId?: string,
  ): Promise<boolean> {
    const statusMessages: Record<string, string> = {
      CONFIRMED: 'Votre commande a été confirmée et est en préparation.',
      SHIPPED: 'Votre commande est en cours de livraison.',
      DELIVERED: 'Votre commande a été livrée.',
      CANCELLED: 'Votre commande a été annulée.',
    };

    return this.sendNotification({
      userId,
      title: 'Mise à jour de commande',
      message: statusMessages[status] || `Le statut de votre commande est maintenant: ${status}`,
      type: 'ORDER_STATUS' as NotificationType,
      relatedId: orderId,
      relatedType: NotificationRelatedType.ORDER,
      playerId,
    });
  }

  /**
   * Envoie une notification de nouveau message
   */
  async sendMessageNotification(
    userId: string,
    senderName: string,
    messagePreview: string,
    conversationId: string,
    playerId?: string,
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      title: `Nouveau message de ${senderName}`,
      message:
        messagePreview.length > 50 ? `${messagePreview.substring(0, 50)}...` : messagePreview,
      type: 'MESSAGE' as NotificationType,
      relatedId: conversationId,
      relatedType: NotificationRelatedType.MESSAGE,
      playerId,
    });
  }

  /**
   * Envoie une notification promotionnelle (broadcast)
   */
  async sendPromotionNotification(title: string, message: string): Promise<boolean> {
    try {
      if (oneSignalService.isAvailable()) {
        await oneSignalService.sendBroadcastNotification({
          title,
          body: message,
          data: { type: 'NEW_PRODUCT' },
        });
      }

      // Enregistrer pour tous les utilisateurs
      const users = await this.prisma.users.findMany({
        select: { user_id: true },
      });

      await Promise.all(
        users.map((user) =>
          this.prisma.notification.create({
            data: {
              userId: user.user_id,
              title,
              message,
              type: 'NEW_PRODUCT' as NotificationType,
              isRead: false,
            },
          }),
        ),
      );

      logger.info(`Notification promotionnelle envoyée à ${users.length} utilisateurs`);
      return true;
    } catch (error) {
      logger.error("Erreur lors de l'envoi de la notification promotionnelle:", error);
      return false;
    }
  }

  /**
   * Récupère les notifications d'un utilisateur
   */
  async getUserNotifications(userId: string, limit: number = 20, offset: number = 0) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Marque une notification comme lue
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      await this.prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
      });
      return true;
    } catch (error) {
      logger.error('Erreur lors du marquage de la notification comme lue:', error);
      return false;
    }
  }

  /**
   * Marque toutes les notifications d'un utilisateur comme lues
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return true;
    } catch (error) {
      logger.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
      return false;
    }
  }

  /**
   * Compte les notifications non lues d'un utilisateur
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Supprime une notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      await this.prisma.notification.deleteMany({
        where: { id: notificationId, userId },
      });
      return true;
    } catch (error) {
      logger.error('Erreur lors de la suppression de la notification:', error);
      return false;
    }
  }
}
