import { Client } from 'onesignal-node';

import { envs } from '@/config/env/env';
import logger from '@/services/logging/logger';

/**
 * Interface pour les données de notification OneSignal
 */
export interface OneSignalNotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  tag?: string;
  renotify?: boolean;
  silent?: boolean;
  timestamp?: number;
  vibrate?: number[];
}

/**
 * Service de notification OneSignal
 * Gère les notifications push pour les apps Android et iOS
 */
export class OneSignalService {
  private static instance: OneSignalService;
  private client!: Client;
  private isConfigured: boolean = false;

  private constructor() {
    // Vérification des variables d'environnement OneSignal
    if (!envs.ONESIGNAL_APP_ID || !envs.ONESIGNAL_REST_API_KEY) {
      logger.warn('OneSignal credentials are not configured. Push notifications will be disabled.');
      return;
    }

    try {
      // Configuration du client OneSignal
      this.client = new Client(envs.ONESIGNAL_APP_ID, envs.ONESIGNAL_REST_API_KEY);
      this.isConfigured = true;
      logger.info('OneSignal client configured successfully');
    } catch (error) {
      logger.error('Failed to configure OneSignal client:', error);
      logger.warn('Push notifications will be disabled');
      this.isConfigured = false;
    }
  }

  public static getInstance(): OneSignalService {
    if (!OneSignalService.instance) {
      OneSignalService.instance = new OneSignalService();
    }
    return OneSignalService.instance;
  }

  /**
   * Vérifie si le service OneSignal est correctement configuré
   */
  public isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Envoie une notification push à un utilisateur spécifique
   * @param playerId ID du joueur OneSignal
   * @param payload Les données de la notification
   */
  public async sendNotification(
    playerId: string,
    payload: OneSignalNotificationPayload,
  ): Promise<any> {
    if (!this.isConfigured) {
      logger.warn('OneSignal is not configured. Skipping notification.');
      throw new Error('OneSignal service is not configured');
    }

    try {
      const notification = {
        contents: {
          en: payload.body || payload.title,
          fr: payload.body || payload.title,
        },
        headings: {
          en: payload.title,
          fr: payload.title,
        },
        include_player_ids: [playerId],
        data: payload.data || {},
        // Paramètres spécifiques mobile
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
        android_visibility: 1,
        priority: 10,
        // Icône et actions
        small_icon: payload.icon,
        large_icon: payload.icon,
        buttons: payload.actions?.map((action) => ({
          id: action.action,
          text: action.title,
          icon: action.icon,
        })),
      };

      const result = await this.client.createNotification(notification);
      logger.info(`Notification envoyée avec succès au joueur ${playerId}`);
      return result;
    } catch (error) {
      logger.error("Erreur lors de l'envoi de la notification OneSignal:", error);
      throw error;
    }
  }

  /**
   * Envoie des notifications push à plusieurs joueurs en parallèle
   * @param playerIds Tableau d'IDs de joueurs OneSignal
   * @param payload Le contenu de la notification à envoyer
   */
  public async sendNotifications(
    playerIds: string[],
    payload: OneSignalNotificationPayload,
  ): Promise<
    Array<{
      playerId: string;
      result?: any;
      error?: Error;
    }>
  > {
    if (!this.isConfigured) {
      logger.warn('OneSignal is not configured. Skipping notifications.');
      throw new Error('OneSignal service is not configured');
    }

    const results = await Promise.allSettled(
      playerIds.map(async (playerId) => {
        try {
          const result = await this.sendNotification(playerId, payload);
          return { playerId, result };
        } catch (error) {
          return { playerId, error: error as Error };
        }
      }),
    );

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        playerId: result.reason.playerId,
        error: result.reason.error,
      };
    });
  }

  /**
   * Envoie une notification à tous les abonnés (broadcast)
   * @param payload Le contenu de la notification
   */
  public async sendBroadcastNotification(payload: OneSignalNotificationPayload): Promise<any> {
    if (!this.isConfigured) {
      logger.warn('OneSignal is not configured. Skipping broadcast notification.');
      throw new Error('OneSignal service is not configured');
    }

    try {
      const notification = {
        contents: {
          en: payload.body || payload.title,
          fr: payload.body || payload.title,
        },
        headings: {
          en: payload.title,
          fr: payload.title,
        },
        included_segments: ['All'], // Envoyer à tous les utilisateurs
        data: payload.data || {},
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
        android_visibility: 1,
        priority: 10,
        small_icon: payload.icon,
        large_icon: payload.icon,
        buttons: payload.actions?.map((action) => ({
          id: action.action,
          text: action.title,
          icon: action.icon,
        })),
      };

      const result = await this.client.createNotification(notification);
      logger.info('Notification broadcast envoyée avec succès');
      return result;
    } catch (error) {
      logger.error("Erreur lors de l'envoi de la notification broadcast OneSignal:", error);
      throw error;
    }
  }

  /**
   * Envoie une notification à un segment spécifique
   * @param segmentName Nom du segment OneSignal
   * @param payload Le contenu de la notification
   */
  public async sendSegmentNotification(
    segmentName: string,
    payload: OneSignalNotificationPayload,
  ): Promise<any> {
    if (!this.isConfigured) {
      logger.warn('OneSignal is not configured. Skipping segment notification.');
      throw new Error('OneSignal service is not configured');
    }

    try {
      const notification = {
        contents: {
          en: payload.body || payload.title,
          fr: payload.body || payload.title,
        },
        headings: {
          en: payload.title,
          fr: payload.title,
        },
        included_segments: [segmentName],
        data: payload.data || {},
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
        android_visibility: 1,
        priority: 10,
        small_icon: payload.icon,
        large_icon: payload.icon,
        buttons: payload.actions?.map((action) => ({
          id: action.action,
          text: action.title,
          icon: action.icon,
        })),
      };

      const result = await this.client.createNotification(notification);
      logger.info(`Notification envoyée avec succès au segment ${segmentName}`);
      return result;
    } catch (error) {
      logger.error(`Erreur lors de l'envoi de la notification au segment ${segmentName}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les informations d'un joueur (device)
   * @param playerId ID du joueur OneSignal
   */
  public async getPlayer(playerId: string): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('OneSignal service is not configured');
    }

    try {
      const result = await this.client.viewDevice(playerId);
      return result;
    } catch (error) {
      logger.error(`Erreur lors de la récupération du joueur ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Met à jour les tags d'un joueur (device)
   * @param playerId ID du joueur OneSignal
   * @param tags Objet des tags à mettre à jour
   */
  public async updatePlayerTags(playerId: string, tags: Record<string, string>): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('OneSignal service is not configured');
    }

    try {
      const result = await this.client.editDevice(playerId, { tags });
      logger.info(`Tags mis à jour avec succès pour le joueur ${playerId}`);
      return result;
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour des tags du joueur ${playerId}:`, error);
      throw error;
    }
  }
}

export const oneSignalService = OneSignalService.getInstance();
