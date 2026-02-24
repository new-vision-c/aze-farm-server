import { PaymentController } from '@controllers/payment/payment.controller';
import { isAuthenticated } from '@middlewares/auth';
import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';
import { Router } from 'express';

import prisma from '@/config/prisma/prisma';
import { asyncHandler, response } from '@/utils/responses/helpers';

const prismaClient = new PrismaClient();
const router = Router();
const paymentController = new PaymentController(prismaClient);

/**
 * Routes pour la gestion des paiements via Monebil
 * En mode démo, les paiements sont automatiquement validés après 2 secondes
 */

// Initialiser un paiement pour une commande
router.post('/payments/order', isAuthenticated, paymentController.initializeOrderPayment);

// Vérifier le statut d'un paiement
router.post('/payments/verify', isAuthenticated, paymentController.verifyPayment);

// Récupérer le statut d'un paiement
router.get('/payments/status/:transactionId', paymentController.getPaymentStatus);

// Callback de Monebil (webhook, pas d'authentification requise)
router.post('/payments/callback', paymentController.handleCallback);

// Annuler un paiement
router.post('/payments/cancel', isAuthenticated, paymentController.cancelPayment);

// Liste des paiements de l'utilisateur
router.get('/payments/my-payments', isAuthenticated, paymentController.getUserPayments);

// Liste des paiements d'une ferme (pour les agriculteurs)
router.get('/payments/farm/:farmId', isAuthenticated, paymentController.getFarmPayments);

/**
 * Routes pour les paiements mobiles (Orange Money, MTN Money, Wave)
 */

// Webhook Orange Money
router.post(
  '/webhook/orange-money',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { pay_token, status, order_id, amount } = req.body;

      console.log('Webhook Orange Money reçu', {
        pay_token,
        status,
        order_id,
        amount,
      });

      // Trouver le paiement correspondant
      const payment = await prisma.mobilePayment.findFirst({
        where: { providerRef: pay_token },
        include: { order: true },
      });

      if (!payment) {
        console.warn('Paiement Orange Money non trouvé', { pay_token });
        return response.notFound(req, res, 'Paiement non trouvé');
      }

      // Mettre à jour le statut du paiement
      let paymentStatus = 'PENDING';
      if (status === 'success' || status === 'completed') {
        paymentStatus = 'COMPLETED';
      } else if (status === 'failed') {
        paymentStatus = 'FAILED';
      }

      await prisma.mobilePayment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus as any,
          updatedAt: new Date(),
        },
      });

      // Si le paiement est réussi, mettre à jour la commande
      if (paymentStatus === 'COMPLETED') {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'CONFIRMED',
            updatedAt: new Date(),
          },
        });

        console.log('Commande confirmée après paiement Orange Money réussi', {
          orderId: payment.orderId,
          paymentId: payment.id,
        });
      }

      return response.success(req, res, { received: true }, 'Webhook traité avec succès');
    } catch (error) {
      console.error('Erreur traitement webhook Orange Money', { error });
      return response.serverError(req, res, 'Erreur traitement webhook');
    }
  }),
);

// Webhook MTN Money
router.post(
  '/webhook/mtn-money',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { externalId, status, amount } = req.body;

      console.log('Webhook MTN Money reçu', {
        externalId,
        status,
        amount,
      });

      // Trouver le paiement correspondant
      const payment = await prisma.mobilePayment.findFirst({
        where: { providerRef: externalId },
        include: { order: true },
      });

      if (!payment) {
        console.warn('Paiement MTN Money non trouvé', { externalId });
        return response.notFound(req, res, 'Paiement non trouvé');
      }

      // Mettre à jour le statut du paiement
      let paymentStatus = 'PENDING';
      if (status === 'successful') {
        paymentStatus = 'COMPLETED';
      } else if (status === 'failed') {
        paymentStatus = 'FAILED';
      }

      await prisma.mobilePayment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus as any,
          updatedAt: new Date(),
        },
      });

      // Si le paiement est réussi, mettre à jour la commande
      if (paymentStatus === 'COMPLETED') {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'CONFIRMED',
            updatedAt: new Date(),
          },
        });

        console.log('Commande confirmée après paiement MTN réussi', {
          orderId: payment.orderId,
          paymentId: payment.id,
        });
      }

      return response.success(req, res, { received: true }, 'Webhook traité avec succès');
    } catch (error) {
      console.error('Erreur traitement webhook MTN Money', { error });
      return response.serverError(req, res, 'Erreur traitement webhook');
    }
  }),
);

// Webhook Wave
router.post(
  '/webhook/wave',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id, status, amount, client_reference } = req.body;

      console.log('Webhook Wave reçu', {
        id,
        status,
        amount,
        client_reference,
      });

      // Trouver le paiement correspondant
      const payment = await prisma.mobilePayment.findFirst({
        where: { providerRef: id },
        include: { order: true },
      });

      if (!payment) {
        console.warn('Paiement Wave non trouvé', { id });
        return response.notFound(req, res, 'Paiement non trouvé');
      }

      // Mettre à jour le statut du paiement
      let paymentStatus = 'PENDING';
      if (status === 'completed' || status === 'success') {
        paymentStatus = 'COMPLETED';
      } else if (status === 'failed') {
        paymentStatus = 'FAILED';
      }

      await prisma.mobilePayment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus as any,
          updatedAt: new Date(),
        },
      });

      // Si le paiement est réussi, mettre à jour la commande
      if (paymentStatus === 'COMPLETED') {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'CONFIRMED',
            updatedAt: new Date(),
          },
        });

        console.log('Commande confirmée après paiement Wave réussi', {
          orderId: payment.orderId,
          paymentId: payment.id,
        });
      }

      return response.success(req, res, { received: true }, 'Webhook traité avec succès');
    } catch (error) {
      console.error('Erreur traitement webhook Wave', { error });
      return response.serverError(req, res, 'Erreur traitement webhook');
    }
  }),
);

// Callback de paiement (redirection après paiement)
router.get(
  '/callback/:orderId',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { status, transaction_id } = req.query;

      console.log('Callback de paiement reçu', {
        orderId,
        status,
        transaction_id,
      });

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payment: true },
      });

      if (!order) {
        return response.notFound(req, res, 'Commande non trouvée');
      }

      // Mettre à jour le statut du paiement si nécessaire
      if (order.payment && status) {
        let paymentStatus = 'PENDING';
        if (status === 'success' || status === 'completed' || status === 'ok') {
          paymentStatus = 'COMPLETED';
        } else if (status === 'failed' || status === 'error') {
          paymentStatus = 'FAILED';
        }

        if (paymentStatus !== order.payment.status) {
          await prisma.mobilePayment.update({
            where: { id: order.payment.id },
            data: {
              status: paymentStatus as any,
              providerRef: (transaction_id as string) || order.payment.providerRef,
              updatedAt: new Date(),
            },
          });

          // Mettre à jour la commande si paiement réussi
          if (paymentStatus === 'COMPLETED') {
            await prisma.order.update({
              where: { id: orderId },
              data: {
                status: 'CONFIRMED',
                updatedAt: new Date(),
              },
            });
          }
        }
      }

      // Rediriger vers l'application frontend avec le statut
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${orderId}?payment_status=${status}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Erreur traitement callback paiement', { error });
      return response.serverError(req, res, 'Erreur traitement callback');
    }
  }),
);

export default router;
