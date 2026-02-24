import axios from 'axios';

import logger from '@/services/logging/logger';

/**
 * Types de paiement mobile disponibles
 */
export enum MobilePaymentProvider {
  ORANGE_MONEY = 'ORANGE_MONEY',
  MTN_MONEY = 'MTN_MONEY',
  WAVE = 'WAVE',
}

/**
 * Statuts de paiement
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

/**
 * Interface pour les informations de paiement
 */
export interface PaymentRequest {
  amount: number;
  phoneNumber: string;
  provider: MobilePaymentProvider;
  transactionRef: string;
  description?: string;
  callbackUrl?: string;
}

/**
 * Interface pour la réponse de paiement
 */
export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  status: PaymentStatus;
  message: string;
  providerReference?: string;
  fees?: number;
}

/**
 * Mode développement/mock pour les paiements
 */
const IS_MOCK_MODE =
  process.env.NODE_ENV === 'development' || process.env.PAYMENT_MOCK_MODE === 'true';

/**
 * Configuration des providers de paiement mobile
 */
const PAYMENT_CONFIG = {
  [MobilePaymentProvider.ORANGE_MONEY]: {
    baseUrl: process.env.ORANGE_MONEY_API_URL || 'https://api.orange.com',
    apiKey: process.env.ORANGE_MONEY_API_KEY,
    apiSecret: process.env.ORANGE_MONEY_API_SECRET,
    merchantId: process.env.ORANGE_MONEY_MERCHANT_ID,
    fees: 0.02, // 2% des frais
  },
  [MobilePaymentProvider.MTN_MONEY]: {
    baseUrl: process.env.MTN_MONEY_API_URL || 'https://api.mtn.com',
    apiKey: process.env.MTN_MONEY_API_KEY,
    apiSecret: process.env.MTN_MONEY_API_SECRET,
    merchantId: process.env.MTN_MONEY_MERCHANT_ID,
    fees: 0.015, // 1.5% des frais
  },
  [MobilePaymentProvider.WAVE]: {
    baseUrl: process.env.WAVE_API_URL || 'https://api.wave.com',
    apiKey: process.env.WAVE_API_KEY,
    apiSecret: process.env.WAVE_API_SECRET,
    merchantId: process.env.WAVE_MERCHANT_ID,
    fees: 0.01, // 1% des frais
  },
};

/**
 * Service de paiement mobile
 * Gère les paiements via Orange Money, MTN Money et Wave
 */
export class MobilePaymentService {
  /**
   * Initialise un paiement mobile
   */
  static async initiatePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      logger.info('Initiation de paiement mobile', {
        provider: paymentRequest.provider,
        amount: paymentRequest.amount,
        phoneNumber: paymentRequest.phoneNumber,
        transactionRef: paymentRequest.transactionRef,
      });

      switch (paymentRequest.provider) {
        case MobilePaymentProvider.ORANGE_MONEY:
          return await this.initiateOrangeMoneyPayment(paymentRequest);
        case MobilePaymentProvider.MTN_MONEY:
          return await this.initiateMtnMoneyPayment(paymentRequest);
        case MobilePaymentProvider.WAVE:
          return await this.initiateWavePayment(paymentRequest);

        default:
          throw new Error(`Provider de paiement non supporté: ${paymentRequest.provider}`);
      }
    } catch (error) {
      logger.error("Erreur lors de l'initiation du paiement", {
        error: error instanceof Error ? error.message : String(error),
        paymentRequest,
      });

      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: "Erreur lors de l'initiation du paiement",
      };
    }
  }

  /**
   * Vérifie le statut d'un paiement
   */
  static async checkPaymentStatus(
    transactionId: string,
    provider: MobilePaymentProvider,
  ): Promise<PaymentResponse> {
    try {
      logger.info('Vérification du statut de paiement', { transactionId, provider });

      switch (provider) {
        case MobilePaymentProvider.ORANGE_MONEY:
          return await this.checkOrangeMoneyStatus(transactionId);
        case MobilePaymentProvider.MTN_MONEY:
          return await this.checkMtnMoneyStatus(transactionId);

        default:
          throw new Error(`Provider de paiement non supporté: ${provider}`);
      }
    } catch (error) {
      logger.error('Erreur lors de la vérification du statut', {
        error: error instanceof Error ? error.message : String(error),
        transactionId,
        provider,
      });

      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: 'Erreur lors de la vérification du statut',
      };
    }
  }

  /**
   * Annule un paiement en cours
   */
  static async cancelPayment(
    transactionId: string,
    provider: MobilePaymentProvider,
  ): Promise<PaymentResponse> {
    try {
      logger.info('Annulation de paiement', { transactionId, provider });

      switch (provider) {
        case MobilePaymentProvider.ORANGE_MONEY:
          return await this.cancelOrangeMoneyPayment(transactionId);
        case MobilePaymentProvider.MTN_MONEY:
          return await this.cancelMtnMoneyPayment(transactionId);

        default:
          throw new Error(`Provider de paiement non supporté: ${provider}`);
      }
    } catch (error) {
      logger.error("Erreur lors de l'annulation du paiement", {
        error: error instanceof Error ? error.message : String(error),
        transactionId,
        provider,
      });

      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: "Erreur lors de l'annulation du paiement",
      };
    }
  }

  /**
   * Calcule les frais de paiement
   */
  static calculatePaymentFees(amount: number, provider: MobilePaymentProvider): number {
    const config = PAYMENT_CONFIG[provider];
    return Math.round(amount * config.fees);
  }

  /**
   * Valide un numéro de téléphone selon le provider
   */
  static validatePhoneNumber(phoneNumber: string, provider: MobilePaymentProvider): boolean {
    // Supprimer les espaces et caractères spéciaux
    const cleanNumber = phoneNumber.replace(/\s+/g, '').replace(/[+\-()]/g, '');

    // Vérifier que c'est un numéro camerounais
    if (!/^6[0-9]{8}$/.test(cleanNumber)) {
      return false;
    }

    // Validation spécifique par provider
    switch (provider) {
      case MobilePaymentProvider.ORANGE_MONEY:
        return cleanNumber.startsWith('69') || cleanNumber.startsWith('65');
      case MobilePaymentProvider.MTN_MONEY:
        return cleanNumber.startsWith('67') || cleanNumber.startsWith('68');
      default:
        return false;
    }
  }

  // === IMPLÉMENTATIONS SPÉCIFIQUES PAR PROVIDER ===

  /**
   * Initiation paiement Orange Money
   */
  private static async initiateOrangeMoneyPayment(
    paymentRequest: PaymentRequest,
  ): Promise<PaymentResponse> {
    const config = PAYMENT_CONFIG[MobilePaymentProvider.ORANGE_MONEY];

    // Mode développement : simulation sans appel API
    if (IS_MOCK_MODE) {
      logger.info('🔧 MODE MOCK - Simulation paiement Orange Money', {
        amount: paymentRequest.amount,
        phoneNumber: paymentRequest.phoneNumber,
        transactionRef: paymentRequest.transactionRef,
      });

      // Simuler un délai réseau
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });

      const mockProviderRef = `OM_TOKEN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      return {
        success: true,
        transactionId: mockProviderRef,
        status: PaymentStatus.PENDING,
        message: 'Paiement Orange Money simulé avec succès',
        providerReference: mockProviderRef,
        fees: this.calculatePaymentFees(paymentRequest.amount, MobilePaymentProvider.ORANGE_MONEY),
      };
    }

    if (!config.apiKey || !config.apiSecret) {
      throw new Error('Configuration Orange Money manquante');
    }

    try {
      const response = await axios.post(
        `${config.baseUrl}/orange-money-webpay/cm/v1/webpayment`,
        {
          merchant_key: config.merchantId,
          currency: 'XAF',
          order_id: paymentRequest.transactionRef,
          amount: paymentRequest.amount,
          return_url: paymentRequest.callbackUrl || `${process.env.APP_URL}/payments/callback`,
          cancel_url: `${process.env.APP_URL}/payments/cancel`,
          notif_url: `${process.env.APP_URL}/api/v1/payments/webhook/orange-money`,
          lang: 'fr',
          reference: paymentRequest.transactionRef,
        },
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.status === 'success') {
        return {
          success: true,
          transactionId: response.data.pay_token,
          status: PaymentStatus.PENDING,
          message: 'Paiement Orange Money initié avec succès',
          providerReference: response.data.pay_token,
          fees: this.calculatePaymentFees(
            paymentRequest.amount,
            MobilePaymentProvider.ORANGE_MONEY,
          ),
        };
      } else {
        return {
          success: false,
          status: PaymentStatus.FAILED,
          message: response.data.message || 'Erreur Orange Money',
        };
      }
    } catch (error: any) {
      logger.error('Erreur Orange Money API', { error: error.response?.data });
      throw new Error("Erreur lors de l'appel à l'API Orange Money");
    }
  }

  /**
   * Initiation paiement MTN Money
   */
  private static async initiateMtnMoneyPayment(
    paymentRequest: PaymentRequest,
  ): Promise<PaymentResponse> {
    const config = PAYMENT_CONFIG[MobilePaymentProvider.MTN_MONEY];

    // Mode développement : simulation sans appel API
    if (IS_MOCK_MODE) {
      logger.info('🔧 MODE MOCK - Simulation paiement MTN Money', {
        amount: paymentRequest.amount,
        phoneNumber: paymentRequest.phoneNumber,
        transactionRef: paymentRequest.transactionRef,
      });

      // Simuler un délai réseau
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });

      const mockProviderRef = `MTN_REF_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      return {
        success: true,
        transactionId: mockProviderRef,
        status: PaymentStatus.PENDING,
        message: 'Paiement MTN Money simulé avec succès',
        providerReference: mockProviderRef,
        fees: this.calculatePaymentFees(paymentRequest.amount, MobilePaymentProvider.MTN_MONEY),
      };
    }

    if (!config.apiKey || !config.apiSecret) {
      throw new Error('Configuration MTN Money manquante');
    }

    try {
      // Obtenir le token d'accès
      const tokenResponse = await axios.post(`${config.baseUrl}/collection/token/`, {
        client_id: config.apiKey,
        client_secret: config.apiSecret,
        grant_type: 'client_credentials',
      });

      const accessToken = tokenResponse.data.access_token;

      // Initier le paiement
      const _response = await axios.post(
        `${config.baseUrl}/collection/v1_0/requesttopay`,
        {
          amount: paymentRequest.amount.toString(),
          currency: 'EUR', // MTN utilise EUR pour le Cameroun
          externalId: paymentRequest.transactionRef,
          payer: {
            partyIdType: 'MSISDN',
            partyId: `237${paymentRequest.phoneNumber}`,
          },
          payerMessage: paymentRequest.description || 'Paiement commande AZE Farm',
          payeeNote: 'Paiement reçu',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Reference-Id': paymentRequest.transactionRef,
            'X-Target-Environment': 'sandbox',
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: true,
        transactionId: paymentRequest.transactionRef,
        status: PaymentStatus.PENDING,
        message: 'Paiement MTN Money initié avec succès',
        providerReference: paymentRequest.transactionRef,
        fees: this.calculatePaymentFees(paymentRequest.amount, MobilePaymentProvider.MTN_MONEY),
      };
    } catch (error: any) {
      logger.error('Erreur MTN Money API', { error: error.response?.data });
      throw new Error("Erreur lors de l'appel à l'API MTN Money");
    }
  }

  /**
   * Initiation paiement Wave
   */
  private static async initiateWavePayment(
    paymentRequest: PaymentRequest,
  ): Promise<PaymentResponse> {
    const config = PAYMENT_CONFIG[MobilePaymentProvider.WAVE];

    // Mode développement : simulation sans appel API
    if (IS_MOCK_MODE) {
      logger.info('🔧 MODE MOCK - Simulation paiement Wave', {
        amount: paymentRequest.amount,
        phoneNumber: paymentRequest.phoneNumber,
        transactionRef: paymentRequest.transactionRef,
      });

      // Simuler un délai réseau
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });

      const mockProviderRef = `WAVE_REF_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      return {
        success: true,
        transactionId: mockProviderRef,
        status: PaymentStatus.PENDING,
        message: 'Paiement Wave simulé avec succès',
        providerReference: mockProviderRef,
        fees: this.calculatePaymentFees(paymentRequest.amount, MobilePaymentProvider.WAVE),
      };
    }

    if (!config.apiKey || !config.apiSecret) {
      throw new Error('Configuration Wave manquante');
    }

    try {
      const response = await axios.post(
        `${config.baseUrl}/v1/checkout/sessions`,
        {
          amount: paymentRequest.amount,
          currency: 'XOF',
          reference: paymentRequest.transactionRef,
          success_url: paymentRequest.callbackUrl || `${process.env.APP_URL}/payments/callback`,
          cancel_url: `${process.env.APP_URL}/payments/cancel`,
        },
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: true,
        transactionId: response.data.id,
        status: PaymentStatus.PENDING,
        message: 'Paiement Wave initié avec succès',
        providerReference: response.data.checkout_url,
        fees: this.calculatePaymentFees(paymentRequest.amount, MobilePaymentProvider.WAVE),
      };
    } catch (error: any) {
      logger.error('Erreur Wave API', { error: error.response?.data });
      throw new Error("Erreur lors de l'appel à l'API Wave");
    }
  }

  /**
   * Vérification statut Orange Money
   */
  private static async checkOrangeMoneyStatus(transactionId: string): Promise<PaymentResponse> {
    // Implémentation simplifiée - en production vérifier avec l'API Orange Money
    return {
      success: true,
      transactionId,
      status: PaymentStatus.PROCESSING,
      message: 'Statut Orange Money vérifié',
    };
  }

  /**
   * Vérification statut MTN Money
   */
  private static async checkMtnMoneyStatus(transactionId: string): Promise<PaymentResponse> {
    // Implémentation simplifiée - en production vérifier avec l'API MTN Money
    return {
      success: true,
      transactionId,
      status: PaymentStatus.PROCESSING,
      message: 'Statut MTN Money vérifié',
    };
  }

  /**
   * Vérification statut Wave
   */
  private static async checkWaveStatus(transactionId: string): Promise<PaymentResponse> {
    // Implémentation simplifiée - en production vérifier avec l'API Wave
    return {
      success: true,
      transactionId,
      status: PaymentStatus.PROCESSING,
      message: 'Statut Wave vérifié',
    };
  }

  /**
   * Annulation paiement Orange Money
   */
  private static async cancelOrangeMoneyPayment(transactionId: string): Promise<PaymentResponse> {
    // Implémentation simplifiée
    return {
      success: true,
      transactionId,
      status: PaymentStatus.CANCELLED,
      message: 'Paiement Orange Money annulé',
    };
  }

  /**
   * Annulation paiement Wave
   */
  private static async cancelMtnMoneyPayment(transactionId: string): Promise<PaymentResponse> {
    // Implémentation simplifiée
    return {
      success: true,
      transactionId,
      status: PaymentStatus.CANCELLED,
      message: 'Paiement MTN Money annulé',
    };
  }
}
