import { Router } from 'express';

import cartController from '@/controllers/cart/cart.controller';
import { isAuthenticated } from '@/middlewares/auth';

const cartRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Gestion du panier utilisateur
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Récupérer ou créer le panier de l'utilisateur
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Panier récupéré avec succès
 *       401:
 *         description: Non authentifié
 */
cartRouter.get('/', isAuthenticated, cartController.getOrCreateCart);

/**
 * @swagger
 * /cart/items:
 *   post:
 *     summary: Ajouter un produit au panier
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID du produit
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantité à ajouter
 *               notes:
 *                 type: string
 *                 description: Notes optionnelles pour la ferme
 *     responses:
 *       200:
 *         description: Item ajouté avec succès
 *       400:
 *         description: Données invalides ou stock insuffisant
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Produit non trouvé
 */
cartRouter.post('/items', isAuthenticated, cartController.addItemToCart);

/**
 * @swagger
 * /cart/items/{itemId}:
 *   patch:
 *     summary: Mettre à jour la quantité d'un item du panier
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'item du panier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Nouvelle quantité (0 pour supprimer)
 *               notes:
 *                 type: string
 *                 description: Notes mises à jour
 *     responses:
 *       200:
 *         description: Item mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Item non trouvé
 */
cartRouter.patch('/items/:itemId', isAuthenticated, cartController.updateCartItem);

/**
 * @swagger
 * /cart/items/{itemId}:
 *   delete:
 *     summary: Supprimer un item du panier
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'item à supprimer
 *     responses:
 *       200:
 *         description: Item supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Item non trouvé
 */
cartRouter.delete('/items/:itemId', isAuthenticated, cartController.removeCartItem);

/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Vider complètement le panier
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Panier vidé avec succès
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Panier non trouvé
 */
cartRouter.delete('/', isAuthenticated, cartController.clearCart);

export default cartRouter;
