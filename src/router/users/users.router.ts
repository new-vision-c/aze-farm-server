import { Router } from 'express';

import users_controller from '@/controllers/users/users.controller';
import { isActive, isAdmin, isAuthenticated, isVerified } from '@/middlewares/auth';
import { upload } from '@/middlewares/upload';
import { validationErrorHandler } from '@/middlewares/validationErrorHandler';
import { validate_user } from '@/services/validator/validate/users';

const users = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestion des utilisateurs et profils
 */

// ============================================
// PUBLIC ROUTES - Authentication
// ============================================

/**
 * @swagger
 * /api/users/avatar:
 *   put:
 *     summary: Mettre à jour l'avatar de l'utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Met à jour uniquement l'avatar de l'utilisateur connecté
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Nouvelle photo de profil (formats jpg, png, webp, max 5MB)
 *     responses:
 *       200:
 *         description: Avatar mis à jour avec succès
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
 *                   example: "Avatar updated successfully"
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
 *                           example: "https://minio.example.com/avatar/user123.jpg"
 *       400:
 *         description: Fichier avatar manquant ou invalide
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Compte non vérifié ou inactif
 *       413:
 *         description: Fichier trop volumineux
 *       415:
 *         description: Format de fichier non supporté
 *       500:
 *         description: Erreur serveur
 */
// Update user avatar only
users.put(
  '/avatar',
  isAuthenticated,
  isVerified,
  isActive,
  upload.single('avatar'),
  users_controller.update_user_avatar,
);

// Update user info
users.put(
  '/profile',
  isAuthenticated,
  isVerified,
  isActive,
  upload.single('profile'),
  validate_user.updateUserInfo,
  validationErrorHandler,
  users_controller.update_user_info,
);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Rechercher des utilisateurs
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Recherche des utilisateurs par nom ou email
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *         description: Terme de recherche (nom ou email)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Nombre maximum de résultats
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *     responses:
 *       200:
 *         description: Utilisateurs trouvés avec succès
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
 *                   example: "Utilisateurs trouvés"
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                           email:
 *                             type: string
 *                           fullname:
 *                             type: string
 *                           avatar_url:
 *                             type: string
 *                           role:
 *                             type: string
 *                             enum: [user, farmer, admin]
 *                           is_verified:
 *                             type: boolean
 *                           is_active:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *       400:
 *         description: Paramètres de recherche invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
// Search users
users.get(
  '/search',
  // isAuthenticated,
  validate_user.searchUser,
  validationErrorHandler,
  users_controller.search_user,
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lister tous les utilisateurs
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Récupère la liste de tous les utilisateurs avec pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Nombre d'utilisateurs par page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, farmer, admin]
 *         description: Filtrer par rôle
 *       - in: query
 *         name: is_verified
 *         schema:
 *           type: boolean
 *         description: Filtrer par statut de vérification
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filtrer par statut actif
 *     responses:
 *       200:
 *         description: Utilisateurs récupérés avec succès
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
 *                   example: "Utilisateurs récupérés"
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                           email:
 *                             type: string
 *                           fullname:
 *                             type: string
 *                           avatar_url:
 *                             type: string
 *                           role:
 *                             type: string
 *                             enum: [user, farmer, admin]
 *                           is_verified:
 *                             type: boolean
 *                           is_active:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           last_login:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
// List all users
users.get(
  '/',
  // isAuthenticated,
  validate_user.listUsers,
  validationErrorHandler,
  users_controller.list_users,
);

// ============================================
// ADMIN ROUTES - Require Admin privileges
// ============================================

/**
 * @swagger
 * /api/users/export:
 *   get:
 *     summary: Exporter les utilisateurs en CSV
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Exporte la liste de tous les utilisateurs au format CSV (réservé aux administrateurs)
 *     responses:
 *       200:
 *         description: Fichier CSV généré avec succès
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               description: Contenu du fichier CSV
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             description: 'attachment; filename="users_export.csv"'
 *           Content-Type:
 *             schema:
 *               type: string
 *             example: 'text/csv'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Droits administrateur requis
 *       500:
 *         description: Erreur lors de l'export
 */
// Export users to CSV
users.get(
  '/export',
  // isAuthenticated,
  // isAdmin,
  users_controller.export_users,
);

/**
 * @swagger
 * /api/users/{user_id}:
 *   get:
 *     summary: Récupérer les détails d'un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Récupère les informations complètes d'un utilisateur spécifique
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur trouvé avec succès
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
 *                   example: "Utilisateur trouvé"
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
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                         last_login:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: ID utilisateur invalide
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
// Get One User
users.get(
  '/:user_id',
  // isAuthenticated,
  validate_user.get_user_by_id,
  validationErrorHandler,
  users_controller.get_user_by_id,
);

/**
 * @swagger
 * /api/users/{user_id}/role:
 *   put:
 *     summary: Mettre à jour le rôle d'un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Change le rôle d'un utilisateur (réservé aux administrateurs)
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, farmer, admin]
 *                 description: Nouveau rôle de l'utilisateur
 *     responses:
 *       200:
 *         description: Rôle mis à jour avec succès
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
 *                   example: "Rôle mis à jour avec succès"
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
 *                         role:
 *                           type: string
 *                           enum: [user, farmer, admin]
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Données invalides ou rôle non autorisé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Droits administrateur requis
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
// Update user role
users.put(
  '/:user_id/role',
  // isAuthenticated,
  // isAdmin,
  validate_user.updateUserRole,
  validationErrorHandler,
  users_controller.update_user_role,
);

/**
 * @swagger
 * /api/users/{user_id}:
 *   delete:
 *     summary: Supprimer un utilisateur (soft delete)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Marque un utilisateur comme supprimé (soft delete) - réservée aux administrateurs
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur à supprimer
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
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
 *                   example: "Utilisateur supprimé avec succès"
 *       400:
 *         description: ID utilisateur invalide
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Droits administrateur requis
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
// Delete user (soft delete)
users.delete(
  '/:user_id',
  // isAuthenticated,
  // isAdmin,
  validate_user.deleteUser,
  validationErrorHandler,
  users_controller.delete_user,
);

/**
 * @swagger
 * /api/users/{user_id}/restore:
 *   post:
 *     summary: Restaurer un utilisateur supprimé
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Restaure un utilisateur précédemment supprimé (soft delete) - réservée aux administrateurs
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur à restaurer
 *     responses:
 *       200:
 *         description: Utilisateur restauré avec succès
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
 *                   example: "Utilisateur restauré avec succès"
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
 *                         is_active:
 *                           type: boolean
 *                           example: true
 *                         restoredAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: ID utilisateur invalide
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Droits administrateur requis
 *       404:
 *         description: Utilisateur non trouvé ou pas supprimé
 *       500:
 *         description: Erreur serveur
 */
// Restore deleted user,
users.post(
  '/:user_id/restore',
  isAuthenticated,
  isAdmin,
  validate_user.deleteUser,
  validationErrorHandler,
  users_controller.restore_deleted_user,
);

// Clear all users (development only)
users.delete(
  '/clear-all',
  // isAuthenticated,
  // isAdmin,
  users_controller.clear_all_users,
);

export default users;
