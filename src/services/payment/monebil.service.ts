import type { PrismaClient } from '@prisma/client';
import { MobilePaymentMethod, PaymentStatus } from '@prisma/client';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
import crypto from 'crypto';

import {
  Currency,
  type MonebilCallback,
  type MonebilResponse,
  type PaymentConfig,
  PaymentErrorType,
  type PaymentInfo,
  type PaymentInitRequest,
  PaymentMethod,
  type PaymentStatusResponse,
  PaymentType,
  type PaymentVerifyRequest,
} from '../../types/payment.types';
import logger from '../logging/logger';

/**
 * Interface pour le service de paiement Monebil
 */
export interface IMonebilService {
  initializePayment(request: PaymentInitRequest): Promise<MonebilResponse>;
  verifyPayment(request: PaymentVerifyRequest): Promise<PaymentStatusResponse>;
  getPaymentStatus(transactionId: string): Promise<PaymentStatusResponse>;
  processCallback(callback: MonebilCallback): Promise<boolean>;
  cancelPayment(transactionId: string): Promise<MonebilResponse>;
}

/**
 * Service de paiement Monebil - Implémentation fonctionnelle
 * Cette version simule les appels API Monebil en attendant l'accès aux vraies APIs
 * En mode démo, les paiements sont automatiquement validés
 */
export class MonebilService implements IMonebilService {
  private readonly apiClient: AxiosInstance;
  private readonly config: PaymentConfig;
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;

    // Configuration du service Monebil
    this.config = {
      mode: (process.env.PAYMENT_MODE as any) || 'demo',
      apiKey: process.env.MONEBIL_API_KEY || 'demo_api_key',
      secretKey: process.env.MONEBIL_SECRET_KEY || 'demo_secret_key',
      baseUrl: process.env.MONEBIL_BASE_URL || 'https://api.monebil.cm',
      timeout: parseInt(process.env.MONEBIL_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.MONEBIL_RETRY_ATTEMPTS || '3'),
    };

    // Configuration du client HTTP
    this.apiClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        'X-API-Version': '1.0',
      },
    });

    logger.info('Service Monebil initialisé', { mode: this.config.mode });
  }

  /**
   * Initialise un paiement
   * En mode démo, la validation est automatique après 2 secondes
   */
  async initializePayment(request: PaymentInitRequest): Promise<MonebilResponse> {
    try {
      logger.info('Initialisation du paiement Monebil', {
        type: request.paymentInfo.type,
        amount: request.paymentInfo.amount,
        method: request.paymentInfo.method,
      });

      // Validation des données
      this.validatePaymentInfo(request.paymentInfo);

      // En mode démo, simulation de la réponse
      if (this.config.mode === 'demo') {
        return this.simulatePaymentInit(request);
      }

      // Préparation des données pour l'API Monebil
      const monebilData = this.prepareMonebilData(request);

      // Appel à l'API Monebil
      const response = await this.apiClient.post('/payments/init', monebilData);

      // Traitement de la réponse
      return this.handleMonebilResponse(response.data);
    } catch (error) {
      logger.error("Erreur lors de l'initialisation du paiement", error);
      return this.handlePaymentError(error);
    }
  }

  /**
   * Vérifie un paiement
   */
  async verifyPayment(request: PaymentVerifyRequest): Promise<PaymentStatusResponse> {
    try {
      logger.info('Vérification du paiement', {
        transactionId: request.transactionId,
      });

      if (this.config.mode === 'demo') {
        return this.simulatePaymentVerification(request);
      }

      const response = await this.apiClient.get(`/payments/${request.transactionId}/status`);

      return {
        transactionId: response.data.transactionId,
        status: response.data.status,
        amount: response.data.amount,
        currency: response.data.currency,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt),
        providerResponse: response.data.providerResponse,
      };
    } catch (error) {
      logger.error('Erreur lors de la vérification du paiement', error);
      throw this.handlePaymentError(error);
    }
  }

  /**
   * Récupère le statut d'un paiement
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    try {
      logger.info('Récupération du statut du paiement', { transactionId });

      if (this.config.mode === 'demo') {
        return this.simulateGetPaymentStatus(transactionId);
      }

      const response = await this.apiClient.get(`/payments/${transactionId}`);

      return {
        transactionId: response.data.transactionId,
        status: response.data.status,
        amount: response.data.amount,
        currency: response.data.currency,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt),
        providerResponse: response.data.providerResponse,
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération du statut', error);
      throw this.handlePaymentError(error);
    }
  }

  /**
   * Traite le callback de Monebil
   */
  async processCallback(callback: MonebilCallback): Promise<boolean> {
    try {
      logger.info('Traitement du callback Monebil', {
        transactionId: callback.transactionId,
        status: callback.status,
      });

      // Vérification de la signature
      if (!this.verifyCallbackSignature(callback)) {
        logger.error('Signature du callback invalide');
        return false;
      }

      // Mise à jour du paiement en base de données
      await this.updatePaymentStatus(
        callback.transactionId,
        callback.status,
        callback.providerResponse,
      );

      logger.info('Callback traité avec succès', {
        transactionId: callback.transactionId,
      });
      return true;
    } catch (error) {
      logger.error('Erreur lors du traitement du callback', error);
      return false;
    }
  }

  /**
   * Annule un paiement
   */
  async cancelPayment(transactionId: string): Promise<MonebilResponse> {
    try {
      logger.info('Annulation du paiement', { transactionId });

      if (this.config.mode === 'demo') {
        return this.simulatePaymentCancellation(transactionId);
      }

      const response = await this.apiClient.post(`/payments/${transactionId}/cancel`);
      return this.handleMonebilResponse(response.data);
    } catch (error) {
      logger.error("Erreur lors de l'annulation du paiement", error);
      return this.handlePaymentError(error);
    }
  }

  /**
   * Valide les informations de paiement
   */
  private validatePaymentInfo(paymentInfo: PaymentInfo): void {
    if (!paymentInfo.amount || paymentInfo.amount <= 0) {
      throw new PaymentError(PaymentErrorType.INVALID_AMOUNT, 'Le montant doit être supérieur à 0');
    }

    if (!paymentInfo.userId) {
      throw new PaymentError(PaymentErrorType.API_ERROR, "L'ID de l'utilisateur est requis");
    }

    if (!paymentInfo.mobileInfo) {
      throw new PaymentError(
        PaymentErrorType.INVALID_PHONE,
        'Les informations de paiement mobile sont requises',
      );
    }
  }

  /**
   * Prépare les données pour l'API Monebil
   */
  private prepareMonebilData(request: PaymentInitRequest): any {
    const { paymentInfo, returnUrl, cancelUrl, notifyUrl } = request;

    return {
      amount: paymentInfo.amount,
      currency: paymentInfo.currency,
      paymentMethod: paymentInfo.method,
      customer: {
        id: paymentInfo.userId,
        phone: paymentInfo.mobileInfo?.phoneNumber,
        email: '', // À ajouter si nécessaire
      },
      metadata: {
        paymentType: paymentInfo.type,
        orderId: paymentInfo.orderId,
        withdrawalRequestId: paymentInfo.withdrawalRequestId,
        farmId: paymentInfo.farmId,
        description: paymentInfo.description,
      },
      returnUrl,
      cancelUrl,
      notifyUrl,
    };
  }

  /**
   * Traite la réponse de Monebil
   */
  private handleMonebilResponse(data: any): MonebilResponse {
    return {
      success: data.success || false,
      transactionId: data.transactionId,
      status: data.status,
      message: data.message,
      errorCode: data.errorCode,
      providerResponse: data,
      redirectUrl: data.redirectUrl,
      otpRequired: data.otpRequired,
    };
  }

  /**
   * Gère les erreurs de paiement
   */
  private handlePaymentError(error: any): MonebilResponse {
    if (error instanceof PaymentError) {
      return {
        success: false,
        message: error.message,
        errorCode: error.type,
      };
    }

    return {
      success: false,
      message: 'Une erreur est survenue lors du traitement du paiement',
      errorCode: PaymentErrorType.API_ERROR,
    };
  }

  /**
   * Vérifie la signature du callback
   */
  private verifyCallbackSignature(callback: MonebilCallback): boolean {
    // En mode démo, on accepte toutes les signatures
    if (this.config.mode === 'demo') {
      return true;
    }

    // Implémentation de la vérification de signature HMAC
    const payload = `${callback.transactionId}${callback.status}${callback.amount}${callback.timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(payload)
      .digest('hex');

    return callback.signature === expectedSignature;
  }

  /**
   * Met à jour le statut du paiement en base
   */
  private async updatePaymentStatus(
    transactionId: string,
    status: PaymentStatus,
    providerResponse?: any,
  ): Promise<void> {
    await this.prisma.mobilePayment.updateMany({
      where: { transactionRef: transactionId },
      data: {
        status: status as any,
        paidAt: status === PaymentStatus.COMPLETED ? new Date() : null,
      },
    });
  }

  /**
   * Simulations pour le mode démo
   */
  private async simulatePaymentInit(request: PaymentInitRequest): Promise<MonebilResponse> {
    // Simulation d'un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const transactionId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Sauvegarde du paiement en base
    await this.prisma.mobilePayment.create({
      data: {
        amount: request.paymentInfo.amount,
        method: this.mapPaymentMethod(request.paymentInfo.method),
        status: 'PENDING' as any,
        phoneNumber: request.paymentInfo.mobileInfo?.phoneNumber || '',
        transactionRef: transactionId,
        orderId: request.paymentInfo.orderId || '',
        userId: request.paymentInfo.userId,
      },
    });

    // Auto-validation après 2 secondes (simulation du succès Monebil)
    setTimeout(async () => {
      await this.simulateAutoComplete(transactionId, request.paymentInfo);
    }, 2000);

    return {
      success: true,
      transactionId,
      status: 'PENDING' as PaymentStatus,
      message: 'Paiement initialisé avec succès (mode démo)',
      otpRequired: true,
    };
  }

  /**
   * Auto-complète un paiement en mode démo
   */
  private async simulateAutoComplete(
    transactionId: string,
    paymentInfo: PaymentInfo,
  ): Promise<void> {
    try {
      await this.prisma.mobilePayment.updateMany({
        where: { transactionRef: transactionId },
        data: {
          status: 'COMPLETED' as any,
          paidAt: new Date(),
        },
      });

      logger.info('Paiement auto-complété (mode démo)', { transactionId });

      // Mise à jour du statut de la commande si applicable
      if (paymentInfo.orderId) {
        await this.prisma.order.update({
          where: { id: paymentInfo.orderId },
          data: { status: 'CONFIRMED' },
        });
      }
    } catch (error) {
      logger.error("Erreur lors de l'auto-complétion du paiement", error);
    }
  }

  private async simulatePaymentVerification(
    request: PaymentVerifyRequest,
  ): Promise<PaymentStatusResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const payment = await this.prisma.mobilePayment.findFirst({
      where: { transactionRef: request.transactionId },
    });

    if (!payment) {
      throw new PaymentError(PaymentErrorType.API_ERROR, 'Transaction non trouvée');
    }

    return {
      transactionId: request.transactionId,
      status: payment.status as PaymentStatus,
      amount: Number(payment.amount),
      currency: 'XAF',
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  private async simulateGetPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    const payment = await this.prisma.mobilePayment.findFirst({
      where: { transactionRef: transactionId },
    });

    if (!payment) {
      throw new PaymentError(PaymentErrorType.API_ERROR, 'Transaction non trouvée');
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

  private async simulatePaymentCancellation(transactionId: string): Promise<MonebilResponse> {
    await this.updatePaymentStatus(transactionId, 'FAILED' as PaymentStatus);

    return {
      success: true,
      transactionId,
      status: 'FAILED' as PaymentStatus,
      message: 'Paiement annulé avec succès (mode démo)',
    };
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

  /**
   * Crée un paiement pour une commande
   */
  async createOrderPayment(
    userId: string,
    orderId: string,
    amount: number,
    phoneNumber: string,
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
      mobileInfo: {
        operator: 'orange' as any,
        phoneNumber,
        countryCode: '+237',
      },
      description: `Paiement pour la commande ${orderId}`,
    };

    const request: PaymentInitRequest = {
      paymentInfo,
    };

    return this.initializePayment(request);
  }
}

/**
 * Erreur de paiement personnalisée
 */
export class PaymentError extends Error {
  constructor(
    public type: PaymentErrorType,
    message: string,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}
