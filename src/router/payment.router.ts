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
 * @swagger
 * tags:
 *   name: Payments
 *   description: Gestion des paiements et transactions
 */

/**
 * Routes pour la gestion des paiements via Monebil
 * En mode démo, les paiements sont automatiquement validés après 2 secondes
 */

/**
 * @swagger
 * /api/payments/order:
 *   post:
 *     summary: Initialiser un paiement pour une commande
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: ID de la commande à payer
 *     responses:
 *       200:
 *         description: Paiement initialisé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Paiement initialisé"
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                       description: ID unique du paiement
 *                     reference:
 *                       type: string
 *                       description: Référence de paiement
 *                     amount:
 *                       type: number
 *                       description: Montant du paiement
 *                     currency:
 *                       type: string
 *                       description: Devise
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, completed, failed, cancelled]
 *                     paymentUrl:
 *                       type: string
 *                       description: URL de redirection pour le paiement (si applicable)
 *       400:
 *         description: Données invalides ou commande inexistante
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (commande n'appartient pas à l'utilisateur)
 *       500:
 *         description: Erreur serveur
 */
// Initialiser un paiement pour une commande
router.post('/payments/order', isAuthenticated, paymentController.initializeOrderPayment);

// Vérifier le statut d'un paiement
/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: "POST /api/payments/verify"
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Opération réussie"
 *                 data:
 *                   type: object
 *                   description: "Données de réponse"
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non authentifié"
 *       500:
 *         description: "Erreur serveur"
 */
router.post('/payments/verify', isAuthenticated, paymentController.verifyPayment);

/**
 * @swagger
 * /api/payments/status/{transactionId}:
 *   get:
 *     summary: Récupérer le statut d'un paiement
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la transaction
 *     responses:
 *       200:
 *         description: Statut du paiement récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Statut du paiement récupéré"
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                     reference:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, completed, failed, cancelled]
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Paiement non trouvé
 *       500:
 *         description: Erreur serveur
 */
// Récupérer le statut d'un paiement
/**
 * @swagger
 * /api/payments/status/:transactionId:
 *   get:
 *     summary: "GET /api/payments/status/:transactionId"
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: "transactionId"
 *     responses:
 *       200:
 *         description: "Succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Opération réussie"
 *                 data:
 *                   type: object
 *                   description: "Données de réponse"
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non authentifié"
 *       500:
 *         description: "Erreur serveur"
 */
router.get('/payments/status/:transactionId', paymentController.getPaymentStatus);

// Callback de Monebil (webhook, pas d'authentification requise)
/**
 * @swagger
 * /api/payments/callback:
 *   post:
 *     summary: "POST /api/payments/callback"
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Opération réussie"
 *                 data:
 *                   type: object
 *                   description: "Données de réponse"
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non authentifié"
 *       500:
 *         description: "Erreur serveur"
 */
router.post('/payments/callback', paymentController.handleCallback);

// Annuler un paiement
/**
 * @swagger
 * /api/payments/cancel:
 *   post:
 *     summary: "POST /api/payments/cancel"
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Opération réussie"
 *                 data:
 *                   type: object
 *                   description: "Données de réponse"
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non authentifié"
 *       500:
 *         description: "Erreur serveur"
 */
router.post('/payments/cancel', isAuthenticated, paymentController.cancelPayment);

// Liste des paiements de l'utilisateur
/**
 * @swagger
 * /api/payments/my-payments:
 *   get:
 *     summary: "GET /api/payments/my-payments"
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Opération réussie"
 *                 data:
 *                   type: object
 *                   description: "Données de réponse"
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non authentifié"
 *       500:
 *         description: "Erreur serveur"
 */
router.get('/payments/my-payments', isAuthenticated, paymentController.getUserPayments);

// Liste des paiements d'une ferme (pour les agriculteurs)
/**
 * @swagger
 * /api/payments/farm/:farmId:
 *   get:
 *     summary: "GET /api/payments/farm/:farmId"
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farmId
 *         required: true
 *         schema:
 *           type: string
 *         description: "farmId"
 *     responses:
 *       200:
 *         description: "Succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Opération réussie"
 *                 data:
 *                   type: object
 *                   description: "Données de réponse"
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non authentifié"
 *       500:
 *         description: "Erreur serveur"
 */
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
