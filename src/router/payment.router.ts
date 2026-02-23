import { PaymentController } from '@controllers/payment/payment.controller';
import { isAuthenticated } from '@middlewares/auth';
import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

const prisma = new PrismaClient();
const router = Router();
const paymentController = new PaymentController(prisma);

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

export default router;
