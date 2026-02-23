import type { PrismaClient } from '@prisma/client';
import { MobilePaymentMethod, PaymentStatus } from '@prisma/client';

import type {
  MonebilCallback,
  MonebilResponse,
  PaymentConfig,
  PaymentInfo,
  PaymentInitRequest,
  PaymentStatusResponse,
  PaymentVerifyRequest,
} from '../../types/payment.types';
import { Currency, PaymentMethod, PaymentType } from '../../types/payment.types';
import logger from '../logging/logger';

/**
 * Service de paiement démo - Validation automatique pour le développement
 * Ce service simule des paiements toujours réussis pour faciliter le développement
 */
export class DemoPaymentService {
  private readonly config: PaymentConfig;
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.config = {
      mode: 'demo',
      apiKey: 'demo_key',
      secretKey: 'demo_secret',
      baseUrl: 'https://demo.monebil.cm',
      timeout: 5000,
      retryAttempts: 1,
    };

    logger.info('Service de paiement démo initialisé');
  }

  /**
   * Initialise un paiement en mode démo (toujours réussi)
   */
  async initializePayment(request: PaymentInitRequest): Promise<MonebilResponse> {
    logger.info('Initialisation du paiement démo', {
      type: request.paymentInfo.type,
      amount: request.paymentInfo.amount,
      method: request.paymentInfo.method,
    });

    // Génération d'un ID de transaction démo
    const transactionId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Sauvegarde du paiement en base via MobilePayment
      await this.prisma.mobilePayment.create({
        data: {
          amount: request.paymentInfo.amount,
          method: this.mapPaymentMethod(request.paymentInfo.method),
          status: 'PENDING' as any, // On commence en PENDING
          phoneNumber: request.paymentInfo.mobileInfo?.phoneNumber || '',
          transactionRef: transactionId,
          orderId: request.paymentInfo.orderId || '',
          userId: request.paymentInfo.userId,
        },
      });

      // En mode démo, on valide automatiquement après 2 secondes
      setTimeout(async () => {
        await this.autoValidatePayment(transactionId, request.paymentInfo);
      }, 2000);

      return {
        success: true,
        transactionId,
        status: 'PENDING' as PaymentStatus,
        message: 'Paiement initialisé avec succès (mode démo)',
        providerResponse: { mode: 'demo', autoValidate: true },
      };
    } catch (error) {
      logger.error("Erreur lors de l'initialisation du paiement démo", error);
      return {
        success: false,
        message: "Erreur lors de l'initialisation du paiement démo",
        errorCode: 'DEMO_INIT_ERROR',
      };
    }
  }

  /**
   * Vérifie un paiement en mode démo
   */
  async verifyPayment(request: PaymentVerifyRequest): Promise<PaymentStatusResponse> {
    logger.info('Vérification du paiement démo', {
      transactionId: request.transactionId,
    });

    const payment = await this.prisma.mobilePayment.findFirst({
      where: { transactionRef: request.transactionId },
    });

    if (!payment) {
      throw new Error('Transaction non trouvée');
    }

    return {
      transactionId: request.transactionId,
      status: payment.status as PaymentStatus,
      amount: Number(payment.amount),
      currency: 'XAF',
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      providerResponse: {},
    };
  }

  /**
   * Récupère le statut d'un paiement en mode démo
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    logger.info('Récupération du statut du paiement démo', { transactionId });

    const payment = await this.prisma.mobilePayment.findFirst({
      where: { transactionRef: transactionId },
    });

    if (!payment) {
      throw new Error('Transaction non trouvée');
    }

    return {
      transactionId,
      status: payment.status as PaymentStatus,
      amount: Number(payment.amount),
      currency: 'XAF',
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      providerResponse: {},
    };
  }

  /**
   * Traite le callback en mode démo
   */
  async processCallback(callback: MonebilCallback): Promise<boolean> {
    logger.info('Traitement du callback démo', {
      transactionId: callback.transactionId,
      status: callback.status,
    });

    try {
      await this.prisma.mobilePayment.updateMany({
        where: { transactionRef: callback.transactionId },
        data: {
          status: callback.status as any,
          paidAt: callback.status === PaymentStatus.COMPLETED ? new Date() : null,
        },
      });

      return true;
    } catch (error) {
      logger.error('Erreur lors du traitement du callback démo', error);
      return false;
    }
  }

  /**
   * Annule un paiement en mode démo
   */
  async cancelPayment(transactionId: string): Promise<MonebilResponse> {
    logger.info('Annulation du paiement démo', { transactionId });

    try {
      await this.prisma.mobilePayment.updateMany({
        where: { transactionRef: transactionId },
        data: {
          status: 'FAILED' as any,
        },
      });

      return {
        success: true,
        transactionId,
        status: 'FAILED' as PaymentStatus,
        message: 'Paiement démo annulé avec succès',
      };
    } catch (error) {
      logger.error("Erreur lors de l'annulation du paiement démo", error);
      return {
        success: false,
        message: "Erreur lors de l'annulation du paiement démo",
        errorCode: 'DEMO_CANCEL_ERROR',
      };
    }
  }

  /**
   * Validation automatique des paiements démo
   */
  private async autoValidatePayment(
    transactionId: string,
    paymentInfo: PaymentInfo,
  ): Promise<void> {
    try {
      logger.info('Validation automatique du paiement démo', { transactionId });

      await this.prisma.mobilePayment.updateMany({
        where: { transactionRef: transactionId },
        data: {
          status: 'COMPLETED' as any,
          paidAt: new Date(),
        },
      });

      logger.info('Paiement démo validé avec succès', { transactionId });

      // Ici on pourrait déclencher d'autres actions post-paiement
      // comme mettre à jour une commande, notifier la ferme, etc.
      if (paymentInfo.orderId) {
        await this.updateOrderStatus(paymentInfo.orderId);
      }
    } catch (error) {
      logger.error('Erreur lors de la validation automatique du paiement démo', error);
    }
  }

  /**
   * Met à jour le statut de la commande après paiement
   */
  private async updateOrderStatus(orderId: string): Promise<void> {
    try {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
        },
      });
      logger.info('Commande confirmée après paiement', { orderId });
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du statut de la commande', error);
    }
  }

  /**
   * Crée un paiement pour une commande
   */
  async createOrderPayment(
    userId: string,
    orderId: string,
    amount: number,
    farmId?: string,
  ): Promise<MonebilResponse> {
    const paymentInfo: PaymentInfo = {
      type: PaymentType.ORDER,
      amount,
      currency: Currency.XAF,
      method: PaymentMethod.ORANGE_MONEY,
      userId,
      orderId,
      farmId,
      description: `Paiement pour la commande ${orderId}`,
    };

    const request: PaymentInitRequest = {
      paymentInfo,
    };

    return this.initializePayment(request);
  }

  /**
   * Mappe les méthodes de paiement vers le format Prisma
   */
  private mapPaymentMethod(method: PaymentMethod): MobilePaymentMethod {
    switch (method) {
      case PaymentMethod.ORANGE_MONEY:
        return MobilePaymentMethod.ORANGE_MONEY;
      case PaymentMethod.MTN_MOMO:
        return MobilePaymentMethod.MTN_MONEY;
      case PaymentMethod.MOOV_MONEY:
        return MobilePaymentMethod.MOOV_MONEY;
      case PaymentMethod.WAVE:
        return MobilePaymentMethod.WAVE;
      default:
        return MobilePaymentMethod.ORANGE_MONEY;
    }
  }
}
