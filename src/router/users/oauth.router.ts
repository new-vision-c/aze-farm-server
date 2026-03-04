import { Router } from 'express';

import users_controller from '@/controllers/users/users.controller';

const oauth = Router();

/**
 * @swagger
 * tags:
 *   name: OAuth
 *   description: Authentification via réseaux sociaux (Google, GitHub, Facebook, etc.)
 */

// ============================================
// OAUTH2.0 ROUTES - Social Authentication
// ============================================

/**
 * @swagger
 * /api/oauth/{provider}:
 *   get:
 *     summary: Initier l'authentification OAuth 2.0
 *     tags: [OAuth]
 *     description: |
 *       Redirige vers le fournisseur OAuth pour l'authentification.
 *
 *       **Fournisseurs supportés:**
 *       - google
 *       - github
 *       - facebook
 *       - instagram
 *       - twitter
 *       - linkedin
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github, facebook, instagram, twitter, linkedin]
 *         description: Fournisseur OAuth
 *       - in: query
 *         name: redirect_uri
 *         schema:
 *           type: string
 *         description: URI de redirection après authentification (optionnel)
 *     responses:
 *       302:
 *         description: Redirection vers le fournisseur OAuth
 *       400:
 *         description: Fournisseur non supporté
 *       500:
 *         description: Erreur de configuration OAuth
 */
// Initiate OAuth flow (redirects to provider)
// Supported providers: google, github, facebook, instagram, twitter, linkedin
oauth.get('/:provider', users_controller.oauth_authorize);

/**
 * @swagger
 * /api/oauth/{provider}/callback:
 *   get:
 *     summary: Callback OAuth 2.0 (ne pas appeler directement)
 *     tags: [OAuth]
 *     description: |
 *       Point de terminaison de callback appelé par le fournisseur OAuth après l'autorisation.
 *
 *       **Cette route ne doit pas être appelée directement par les clients.**
 *       Elle est appelée automatiquement par le fournisseur OAuth.
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github, facebook, instagram, twitter, linkedin]
 *         description: Fournisseur OAuth
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Code d'autorisation OAuth
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: État OAuth pour la sécurité CSRF
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Erreur OAuth (si applicable)
 *     responses:
 *       302:
 *         description: Redirection vers l'application frontend avec tokens
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *             description: URL de redirection avec tokens en paramètres
 *       400:
 *         description: Erreur d'authentification OAuth
 *       500:
 *         description: Erreur serveur lors du traitement OAuth
 */
// OAuth callback (provider redirects here after authorization)
oauth.get('/:provider/callback', users_controller.oauth_callback);

// ============================================
// OAUTH2.0 PROTECTED ROUTES
// ============================================

/**
 * @swagger
 * /api/oauth/accounts:
 *   get:
 *     summary: Récupérer les comptes OAuth liés
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     description: Retourne la liste des fournisseurs OAuth liés au compte utilisateur
 *     responses:
 *       200:
 *         description: Comptes OAuth récupérés avec succès
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
 *                   example: "Comptes OAuth récupérés"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           provider:
 *                             type: string
 *                             enum: [google, github, facebook, instagram, twitter, linkedin]
 *                             example: "google"
 *                           providerId:
 *                             type: string
 *                             description: ID utilisateur chez le fournisseur
 *                           email:
 *                             type: string
 *                             description: Email du compte OAuth
 *                           displayName:
 *                             type: string
 *                             description: Nom d'affichage
 *                           linkedAt:
 *                             type: string
 *                             format: date-time
 *                             description: Date de liaison du compte
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
// Get user's linked OAuth accounts
oauth.get(
  '/accounts',
  // isAuthenticated,
  users_controller.oauth_accounts,
);

/**
 * @swagger
 * /api/oauth/{provider}/unlink:
 *   delete:
 *     summary: Délier un compte OAuth
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     description: Supprime la liaison entre le compte utilisateur et un fournisseur OAuth
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github, facebook, instagram, twitter, linkedin]
 *         description: Fournisseur OAuth à délier
 *     responses:
 *       200:
 *         description: Compte OAuth délié avec succès
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
 *                   example: "Compte OAuth délié avec succès"
 *       400:
 *         description: Fournisseur invalide ou compte non lié
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
// Unlink OAuth provider from account
oauth.delete(
  '/:provider/unlink',
  // isAuthenticated,
  users_controller.oauth_unlink,
);

export default oauth;
