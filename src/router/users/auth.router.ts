import { Router } from 'express';

import users_controller from '@/controllers/users/users.controller';
import { isAuthenticated } from '@/middlewares/auth';
import { upload } from '@/middlewares/upload';
import { validationErrorHandler } from '@/middlewares/validationErrorHandler';
import { validate_user } from '@/services/validator/validate/users';

const auth = Router();

// ============================================
// SWAGGER TAGS
// ============================================

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Gestion de l'authentification et des comptes utilisateurs
 */

// ============================================
// PUBLIC ROUTES - Authentication
// ============================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur - Étape 1
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullname
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Mot de passe (min 6 caractères, 1 majuscule, 1 minuscule, 1 chiffre ou caractère spécial)
 *               fullname:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Nom complet
 *               profile:
 *                 type: string
 *                 format: binary
 *                 description: Photo de profil (optionnel, formats jpg, png, webp)
 *     responses:
 *       200:
 *         description: Inscription réussie - étape 1
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
 *                   example: "Utilisateur créé avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     step:
 *                       type: integer
 *                       example: 1
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         email:
 *                           type: string
 *                           example: "user@example.com"
 *                         fullname:
 *                           type: string
 *                           example: "Jean Dupont"
 *                         avatar_url:
 *                           type: string
 *                           example: "https://example.com/avatar.jpg"
 *                         is_verified:
 *                           type: boolean
 *                           example: false
 *                         is_active:
 *                           type: boolean
 *                           example: true
 *                     token:
 *                       type: string
 *                       description: Token de session temporaire
 *                     requiresOtp:
 *                       type: boolean
 *                       example: true
 *                     otpCode:
 *                       type: string
 *                       description: Code OTP (uniquement en développement)
 *       400:
 *         description: Données invalides ou email déjà utilisé
 *       500:
 *         description: Erreur serveur
 */
// Sign up
auth.post(
  '/register',
  upload.single('profile'),
  validate_user.signup,
  validationErrorHandler,
  users_controller.signup,
);

// Verify account with OTP
auth.post(
  '/verify-otp',
  isAuthenticated,
  validate_user.verifyAccount,
  validationErrorHandler,
  users_controller.verify_otp,
);

// Resend OTP
auth.post(
  '/resend-otp',
  validate_user.resendOtp,
  validationErrorHandler,
  users_controller.resend_otp,
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Mot de passe
 *     responses:
 *       200:
 *         description: Connexion réussie
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
 *                   example: "Connexion réussie"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         email:
 *                           type: string
 *                           example: "user@example.com"
 *                         fullname:
 *                           type: string
 *                           example: "Jean Dupont"
 *                         avatar_url:
 *                           type: string
 *                           example: "https://example.com/avatar.jpg"
 *                         role:
 *                           type: string
 *                           enum: [user, farmer, admin]
 *                           example: "user"
 *                         is_verified:
 *                           type: boolean
 *                           example: true
 *                         is_active:
 *                           type: boolean
 *                           example: true
 *                         last_login:
 *                           type: string
 *                           format: date-time
 *                     accessToken:
 *                       type: string
 *                       description: Token JWT d'accès
 *                     refreshToken:
 *                       type: string
 *                       description: Token de rafraîchissement
 *       400:
 *         description: Email ou mot de passe incorrect
 *       401:
 *         description: Compte non vérifié ou désactivé
 *       500:
 *         description: Erreur serveur
 */
// Login
auth.post('/login', validate_user.login, validationErrorHandler, users_controller.login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Mot de passe oublié - Étape 1 (Envoi OTP)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email du compte
 *     responses:
 *       200:
 *         description: OTP envoyé avec succès
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
 *                   example: "Code OTP envoyé à votre email"
 *                 data:
 *                   type: object
 *                   properties:
 *                     resetToken:
 *                       type: string
 *                       description: Token de réinitialisation temporaire
 *                     expiresIn:
 *                       type: integer
 *                       example: 600
 *                       description: Durée de validité en secondes (10 minutes)
 *       400:
 *         description: Email invalide ou compte inexistant
 *       429:
 *         description: Trop de tentatives, veuillez réessayer plus tard
 *       500:
 *         description: Erreur serveur
 */
// Forgot password - Step 1: Send OTP
auth.post(
  '/forgot-password',
  validate_user.forgotPasswordStep1,
  validationErrorHandler,
  users_controller.forgotPasswordStep1,
);

/**
 * @swagger
 * /api/auth/forgot-password/verify-otp:
 *   post:
 *     summary: Mot de passe oublié - Étape 2 (Vérification OTP)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email du compte
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: Code OTP à 6 chiffres
 *     responses:
 *       200:
 *         description: OTP validé, token de réinitialisation généré
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
 *                   example: "OTP validé avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     resetToken:
 *                       type: string
 *                       description: Token pour la réinitialisation du mot de passe
 *                     expiresIn:
 *                       type: integer
 *                       example: 600
 *                       description: Durée de validité en secondes
 *       400:
 *         description: OTP invalide ou expiré
 *       401:
 *         description: Session invalide
 *       500:
 *         description: Erreur serveur
 */
// Forgot password - Step 2: Verify OTP and generate session token
auth.post(
  '/forgot-password/verify-otp',
  validate_user.forgotPasswordStep2,
  validationErrorHandler,
  users_controller.forgotPasswordStep2,
);

/**
 * @swagger
 * /api/auth/forgot-password/reset:
 *   post:
 *     summary: Mot de passe oublié - Étape 3 (Réinitialisation)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetToken
 *               - newPassword
 *             properties:
 *               resetToken:
 *                 type: string
 *                 description: Token de réinitialisation obtenu à l'étape 2
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Nouveau mot de passe
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
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
 *                   example: "Mot de passe réinitialisé avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         fullname:
 *                           type: string
 *       400:
 *         description: Token invalide ou mot de passe trop faible
 *       401:
 *         description: Token expiré
 *       500:
 *         description: Erreur serveur
 */
// Forgot password - Step 3: Reset password with session token
auth.post(
  '/forgot-password/reset',
  validate_user.forgotPasswordStep3,
  validationErrorHandler,
  users_controller.forgotPasswordStep3,
);

/**
 * @swagger
 * /api/auth/reset-password/{resetToken}:
 *   post:
 *     summary: Réinitialisation du mot de passe via token
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: resetToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de réinitialisation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Nouveau mot de passe
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
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
 *                   example: "Mot de passe réinitialisé avec succès"
 *       400:
 *         description: Token invalide ou mot de passe trop faible
 *       401:
 *         description: Token expiré
 *       500:
 *         description: Erreur serveur
 */
// Reset password
auth.post(
  '/reset-password/:resetToken',
  validate_user.resetPassword,
  validationErrorHandler,
  users_controller.reset_password,
);

// ============================================
// PROTECTED ROUTES - Require Authentication
// ============================================

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Déconnexion utilisateur
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
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
 *                   example: "Déconnexion réussie"
 *       401:
 *         description: Token invalide ou expiré
 *       500:
 *         description: Erreur serveur
 */
// Logout
auth.post(
  '/logout',
  // isAuthenticated,
  users_controller.logout,
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Changer le mot de passe
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Mot de passe actuel
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Nouveau mot de passe
 *     responses:
 *       200:
 *         description: Mot de passe changé avec succès
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
 *                   example: "Mot de passe changé avec succès"
 *       400:
 *         description: Mot de passe actuel incorrect ou nouveau mot de passe invalide
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
// Change password
auth.post(
  '/change-password',
  // isAuthenticated,
  validate_user.changePassword,
  validationErrorHandler,
  users_controller.change_password,
);

/**
 * @swagger
 * /api/auth/me/profile:
 *   put:
 *     summary: Mettre à jour le profil utilisateur
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Nouveau nom complet
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Nouvelle photo de profil (formats jpg, png, webp)
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
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
 *                   example: "Profil mis à jour avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         fullname:
 *                           type: string
 *                         avatar_url:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [user, farmer, admin]
 *                         is_verified:
 *                           type: boolean
 *                         is_active:
 *                           type: boolean
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
// Update profile
auth.put(
  '/me/profile',
  upload.single('avatar'), // Gérer l'upload d'un fichier nommé 'avatar'
  isAuthenticated,
  users_controller.updateProfile,
);

/**
 * @swagger
 * /api/auth/me/profile:
 *   get:
 *     summary: Récupérer le profil utilisateur
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
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
 *                   example: "Profil récupéré avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         email:
 *                           type: string
 *                           example: "user@example.com"
 *                         fullname:
 *                           type: string
 *                           example: "Jean Dupont"
 *                         avatar_url:
 *                           type: string
 *                           example: "https://example.com/avatar.jpg"
 *                         role:
 *                           type: string
 *                           enum: [user, farmer, admin]
 *                           example: "user"
 *                         is_verified:
 *                           type: boolean
 *                           example: true
 *                         is_active:
 *                           type: boolean
 *                           example: true
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                         last_login:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
// Get profile
auth.get('/me/profile', isAuthenticated, users_controller.getProfile);

export default auth;
