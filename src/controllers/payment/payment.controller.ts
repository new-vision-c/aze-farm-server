import type { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

import logger from '../../services/logging/logger';
import { MonebilService } from '../../services/payment/monebil.service';
import type { AuthenticatedRequest } from '../../types/express';
import type { MonebilCallback, PaymentVerifyRequest } from '../../types/payment.types';

/**
 * Contrôleur de paiement
 * Gère les paiements via Monebil en mode démo (validation auto) ou production
 */
export class PaymentController {
  private monebilService: MonebilService;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.monebilService = new MonebilService(prisma);
  }

  /**
   * Initialise un paiement pour une commande
   */
  initializeOrderPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, amount, phoneNumber, farmId } = req.body;
      const userId = (req as AuthenticatedRequest).user?.user_id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      if (!orderId || !amount || !phoneNumber) {
        res.status(400).json({
          success: false,
          message: 'orderId, amount et phoneNumber sont requis',
        });
        return;
      }

      const result = await this.monebilService.createOrderPayment(
        userId,
        orderId,
        amount,
        phoneNumber,
        farmId,
      );

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Erreur lors de l'initialisation du paiement", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'initialisation du paiement",
      });
    }
  };

  /**
   * Vérifie le statut d'un paiement
   */
  verifyPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.body;

      if (!transactionId) {
        res.status(400).json({
          success: false,
          message: 'transactionId est requis',
        });
        return;
      }

      const verifyRequest: PaymentVerifyRequest = {
        transactionId,
      };

      const result = await this.monebilService.verifyPayment(verifyRequest);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Erreur lors de la vérification du paiement', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du paiement',
      });
    }
  };

  /**
   * Récupère le statut d'un paiement
   */
  getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.params;

      if (!transactionId) {
        res.status(400).json({
          success: false,
          message: 'transactionId est requis',
        });
        return;
      }

      const result = await this.monebilService.getPaymentStatus(transactionId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération du statut', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du statut du paiement',
      });
    }
  };

  /**
   * Traite le callback de Monebil
   */
  handleCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const callback: MonebilCallback = req.body;

      logger.info('Callback Monebil reçu', {
        transactionId: callback.transactionId,
        status: callback.status,
      });

      const success = await this.monebilService.processCallback(callback);

      if (success) {
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({
          success: false,
          message: 'Erreur lors du traitement du callback',
        });
      }
    } catch (error) {
      logger.error('Erreur lors du traitement du callback', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne lors du traitement du callback',
      });
    }
  };

  /**
   * Annule un paiement
   */
  cancelPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.body;

      if (!transactionId) {
        res.status(400).json({
          success: false,
          message: 'transactionId est requis',
        });
        return;
      }

      const result = await this.monebilService.cancelPayment(transactionId);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error("Erreur lors de l'annulation du paiement", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'annulation du paiement",
      });
    }
  };

  /**
   * Liste les paiements de l'utilisateur connecté
   */
  getUserPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user?.user_id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const payments = await this.prisma.mobilePayment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des paiements', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paiements',
      });
    }
  };

  /**
   * Liste les paiements d'une ferme (pour les agriculteurs)
   */
  getFarmPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { farmId } = req.params;
      const userId = (req as AuthenticatedRequest).user?.user_id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const farm = await this.prisma.farm.findFirst({
        where: { id: farmId, farmerId: userId },
      });

      if (!farm) {
        res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette ferme',
        });
        return;
      }

      const payments = await this.prisma.mobilePayment.findMany({
        where: {
          order: {
            farmId,
          },
        },
        include: {
          order: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des paiements de la ferme', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paiements',
      });
    }
  };
}
