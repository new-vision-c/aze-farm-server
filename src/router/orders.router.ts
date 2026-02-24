import { Router } from 'express';

import ordersController from '@/controllers/orders/orders.controller';
import { isAuthenticated } from '@/middlewares/auth';

const ordersRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestion des commandes
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Créer des commandes à partir du panier
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliveryAddress
 *               - paymentMethod
 *               - phoneNumber
 *             properties:
 *               deliveryAddress:
 *                 type: string
 *                 description: Adresse de livraison
 *               deliveryType:
 *                 type: string
 *                 enum: [PICKUP, DELIVERY, MARKET]
 *                 description: Type de livraison
 *               paymentMethod:
 *                 type: string
 *                 enum: [ORANGE_MONEY, MTN_MONEY, WAVE, MOOV_MONEY]
 *                 description: Méthode de paiement
 *               phoneNumber:
 *                 type: string
 *                 description: Numéro de téléphone pour le paiement
 *     responses:
 *       201:
 *         description: Commandes créées avec succès
 *       400:
 *         description: Panier vide ou stock insuffisant
 *       401:
 *         description: Non authentifié
 */
ordersRouter.post('/', isAuthenticated, ordersController.createOrdersFromCart);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Récupérer les commandes de l'utilisateur
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED]
 *         description: Filtrer par statut
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Liste des commandes
 *       401:
 *         description: Non authentifié
 */
ordersRouter.get('/', isAuthenticated, ordersController.getUserOrders);

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Récupérer le détail d'une commande
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande
 *     responses:
 *       200:
 *         description: Détail de la commande
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Commande non trouvée
 */
ordersRouter.get('/:orderId', isAuthenticated, ordersController.getOrderById);

/**
 * @swagger
 * /orders/{orderId}/cancel:
 *   post:
 *     summary: Annuler une commande
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Raison de l'annulation
 *     responses:
 *       200:
 *         description: Commande annulée avec succès
 *       400:
 *         description: Commande ne peut pas être annulée
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Commande non trouvée
 */
ordersRouter.post('/:orderId/cancel', isAuthenticated, ordersController.cancelOrder);

/**
 * @swagger
 * /orders/farm/orders:
 *   get:
 *     summary: Récupérer les commandes de la ferme (agriculteur)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Liste des commandes de la ferme
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès réservé aux agriculteurs
 */
ordersRouter.get('/farm/orders', isAuthenticated, ordersController.getFarmOrders);

/**
 * @swagger
 * /orders/{orderId}/status:
 *   patch:
 *     summary: Mettre à jour le statut d'une commande (agriculteur)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED]
 *               deliveryDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès réservé aux agriculteurs
 *       404:
 *         description: Commande non trouvée
 */
ordersRouter.patch('/:orderId/status', isAuthenticated, ordersController.updateOrderStatus);

/**
 * @swagger
 * /orders/{orderId}/tracking:
 *   get:
 *     summary: Obtenir le tracking timeline d'une commande
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Timeline de la commande
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Commande non trouvée
 */
ordersRouter.get('/:orderId/tracking', isAuthenticated, ordersController.getOrderTracking);

/**
 * @swagger
 * /orders/{orderId}/delivery/confirm:
 *   post:
 *     summary: Générer le token/QR code de confirmation de livraison (agriculteur)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token et données QR générés
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès réservé aux agriculteurs
 *       404:
 *         description: Commande non trouvée
 */
ordersRouter.post(
  '/:orderId/delivery/confirm',
  isAuthenticated,
  ordersController.generateDeliveryConfirmation,
);

/**
 * @swagger
 * /orders/{orderId}/delivery/receive:
 *   post:
 *     summary: Confirmer la réception d'une commande (client)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de confirmation manuel
 *               qrData:
 *                 type: string
 *                 description: Données du QR code scanné
 *     responses:
 *       200:
 *         description: Livraison confirmée avec succès
 *       400:
 *         description: Token ou QR code invalide
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Commande non trouvée
 */
ordersRouter.post('/:orderId/delivery/receive', isAuthenticated, ordersController.confirmDelivery);

export default ordersRouter;
