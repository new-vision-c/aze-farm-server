import type { Request, Response } from 'express';
import { validationResult } from 'express-validator';

import prisma from '@/config/prisma/prisma';
import { asyncHandler, response } from '@/utils/responses/helpers';

/**
 * Contrôleur pour la gestion de la localisation des utilisateurs
 */
export class LocationController {
  /**
   * Mettre à jour la position de l'utilisateur
   * @swagger
   * /api/users/location:
   *   put:
   *     tags:
   *       - Users
   *     summary: Mettre à jour la position de l'utilisateur
   *     description: Met à jour les coordonnées GPS de l'utilisateur connecté
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - latitude
   *               - longitude
   *             properties:
   *               latitude:
   *                 type: number
   *                 minimum: -90
   *                 maximum: 90
   *                 description: Latitude de l'utilisateur
   *                 example: 48.8566
   *               longitude:
   *                 type: number
   *                 minimum: -180
   *                 maximum: 180
   *                 description: Longitude de l'utilisateur
   *                 example: 2.3522
   *               address:
   *                 type: string
   *                 description: Adresse formatée (optionnel)
   *                 example: "Paris, France"
   *     responses:
   *       200:
   *         description: Position mise à jour avec succès
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
   *                   example: 'Position mise à jour avec succès'
   *                 data:
   *                   type: object
   *                   properties:
   *                     latitude:
   *                       type: number
   *                       example: 48.8566
   *                     longitude:
   *                       type: number
   *                       example: 2.3522
   *                     address:
   *                       type: string
   *                       example: "Paris, France"
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Erreur de validation
   *       401:
   *         description: Non authentifié
   *       500:
   *         description: Erreur serveur
   */
  updateLocation = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      try {
        // Vérifier les erreurs de validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return response.badRequest(req, res, 'Erreurs de validation');
        }

        const { latitude, longitude, address } = req.body;
        const userId = (req as any).user?.user_id; // Récupérer l'ID de l'utilisateur depuis le middleware d'auth

        if (!userId) {
          return response.unauthorized(req, res, 'Utilisateur non authentifié');
        }

        // Valider les coordonnées
        if (latitude < -90 || latitude > 90) {
          return response.badRequest(req, res, 'La latitude doit être entre -90 et 90');
        }

        if (longitude < -180 || longitude > 180) {
          return response.badRequest(req, res, 'La longitude doit être entre -180 et 180');
        }

        // Mettre à jour la position de l'utilisateur
        const updatedUser = await prisma.users.update({
          where: { user_id: userId },
          data: {
            latitude: latitude,
            longitude: longitude,
            updated_at: new Date(),
          },
          select: {
            user_id: true,
            email: true,
            fullname: true,
            latitude: true,
            longitude: true,
            updated_at: true,
          },
        });

        return response.success(
          req,
          res,
          {
            latitude: updatedUser.latitude,
            longitude: updatedUser.longitude,
            address: address || null,
            updatedAt: updatedUser.updated_at,
          },
          'Position mise à jour avec succès',
        );
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la position:', error);
        return response.serverError(
          req,
          res,
          'Erreur lors de la mise à jour de la position',
          error as Error,
        );
      }
    },
  );

  /**
   * Obtenir la position actuelle de l'utilisateur
   * @swagger
   * /api/users/location:
   *   get:
   *     tags:
   *       - Users
   *     summary: Obtenir la position de l'utilisateur
   *     description: Récupère les coordonnées GPS actuelles de l'utilisateur connecté
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Position récupérée avec succès
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
   *                   example: 'Position récupérée avec succès'
   *                 data:
   *                   type: object
   *                   properties:
   *                     latitude:
   *                       type: number
   *                       example: 48.8566
   *                     longitude:
   *                       type: number
   *                       example: 2.3522
   *                     hasLocation:
   *                       type: boolean
   *                       example: true
   *       401:
   *         description: Non authentifié
   *       500:
   *         description: Erreur serveur
   */
  getLocation = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    try {
      const userId = (req as any).user?.user_id; // Récupérer l'ID de l'utilisateur depuis le middleware d'auth

      if (!userId) {
        return response.unauthorized(req, res, 'Utilisateur non authentifié');
      }

      // Récupérer la position de l'utilisateur
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: {
          user_id: true,
          latitude: true,
          longitude: true,
          updated_at: true,
        },
      });

      if (!user) {
        return response.notFound(req, res, 'Utilisateur non trouvé');
      }

      return response.success(
        req,
        res,
        {
          latitude: user.latitude,
          longitude: user.longitude,
          hasLocation: user.latitude !== null && user.longitude !== null,
          updatedAt: user.updated_at,
        },
        'Position récupérée avec succès',
      );
    } catch (error) {
      console.error('Erreur lors de la récupération de la position:', error);
      return response.serverError(
        req,
        res,
        'Erreur lors de la récupération de la position',
        error as Error,
      );
    }
  });
}
