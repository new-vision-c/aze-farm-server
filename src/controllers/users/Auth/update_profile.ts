import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { I18nService } from '@/services/I18nService';
import log from '@/services/logging/logger';
import { CloudinaryProvider } from '@/services/upload/providers/CloudinaryProvider';
import { asyncHandler, response } from '@/utils/responses/helpers';

// Interface pour les données de mise à jour du profil
interface UpdateProfileData {
  fullname?: string;
}

// Initialiser Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
};

const cloudinary = new CloudinaryProvider(cloudinaryConfig, console);

//& Mettre à jour le profil utilisateur
const updateProfile = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { fullname } = req.body as UpdateProfileData;
    const avatarFile = (req as any).file; // Fichier uploadé via multer
    const userId = (req as any).user?.id;

    // Détecter la langue depuis le header ou utiliser le français par défaut
    const acceptLanguage = req.headers['accept-language'] as string;
    const i18nService = new I18nService();
    const language = i18nService.detectLanguage(acceptLanguage) as 'fr' | 'en';

    if (!userId) {
      return response.unauthorized(
        req,
        res,
        i18nService.translate('auth.user_not_authenticated', language),
      );
    }

    try {
      // Vérifier si l'utilisateur existe
      const existingUser = await prisma.users.findFirst({
        where: {
          user_id: userId,
          is_deleted: false,
        },
      });

      if (!existingUser) {
        return response.notFound(req, res, i18nService.translate('users.not_found', language));
      }

      // Préparer les données de mise à jour
      const updateData: any = {
        updated_at: new Date(),
      };

      // Ajouter seulement les champs fournis
      if (fullname !== undefined) {
        updateData.fullname = fullname;
      }

      // Gérer l'upload de l'avatar si un fichier est fourni
      if (avatarFile) {
        try {
          // Upload l'avatar sur Cloudinary depuis le buffer
          const uploadResult = await cloudinary.putObject(
            `user_${userId}_avatar`,
            avatarFile.buffer, // Buffer du fichier uploadé
            avatarFile.size,
            avatarFile.mimetype,
            {
              folder: 'avatars',
              resource_type: 'image',
              use_filename: true,
              unique_filename: true,
            },
          );

          // Mettre à jour avec l'URL de Cloudinary
          updateData.avatar_url = uploadResult.url;

          log.info('Avatar uploadé sur Cloudinary', {
            userId,
            originalName: avatarFile.originalname,
            size: avatarFile.size,
            mimetype: avatarFile.mimetype,
            publicId: uploadResult.publicId,
            url: uploadResult.url,
            language,
          });

          // Supprimer l'ancien avatar de Cloudinary s'il existe et est différent
          if (existingUser.avatar_url && existingUser.avatar_url !== uploadResult.url) {
            try {
              // Extraire le public_id de l'ancienne URL Cloudinary
              const oldUrlParts = existingUser.avatar_url.split('/');
              const oldPublicId = oldUrlParts[oldUrlParts.length - 1]?.split('.')[0];

              if (oldPublicId) {
                await cloudinary.remove(oldPublicId);
                log.info('Ancien avatar supprimé de Cloudinary', {
                  userId,
                  oldPublicId,
                  language,
                });
              }
            } catch (deleteError: any) {
              log.warn("Impossible de supprimer l'ancien avatar de Cloudinary", {
                userId,
                oldPublicId: existingUser.avatar_url,
                error: deleteError.message,
                language,
              });
            }
          }
        } catch (uploadError: any) {
          log.error('Erreur upload avatar sur Cloudinary', {
            userId,
            error: uploadError.message,
            stack: uploadError.stack,
            language,
          });

          return response.serverError(
            req,
            res,
            i18nService.translate('errors.server_error', language),
            uploadError,
          );
        }
      }

      // Mettre à jour le profil
      const updatedUser = await prisma.users.update({
        where: { user_id: userId },
        data: updateData,
        select: {
          user_id: true,
          email: true,
          fullname: true,
          avatar_url: true,
          role: true,
          is_active: true,
          is_verified: true,
          created_at: true,
          updated_at: true,
        },
      });

      log.info('Profil utilisateur mis à jour', {
        userId,
        updatedFields: Object.keys(updateData),
        language,
      });

      return response.success(
        req,
        res,
        updatedUser,
        i18nService.translate('users.profile_updated', language),
      );
    } catch (error: any) {
      log.error('Erreur lors de la mise à jour du profil', {
        userId,
        error: error.message,
        stack: error.stack,
        language,
      });

      return response.serverError(req, res, i18nService.translate('errors.server_error', language));
    }
  },
);

//& Récupérer le profil utilisateur
const getProfile = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const userId = (req as any).user?.id;

    // Détecter la langue depuis le header ou utiliser le français par défaut
    const acceptLanguage = req.headers['accept-language'] as string;
    const i18nService = new I18nService();
    const language = i18nService.detectLanguage(acceptLanguage) as 'fr' | 'en';

    if (!userId) {
      return response.unauthorized(
        req,
        res,
        i18nService.translate('auth.user_not_authenticated', language),
      );
    }

    try {
      // Récupérer le profil utilisateur
      const user = await prisma.users.findFirst({
        where: {
          user_id: userId,
          is_deleted: false,
        },
        select: {
          user_id: true,
          email: true,
          fullname: true,
          avatar_url: true,
          role: true,
          is_active: true,
          is_verified: true,
          created_at: true,
          updated_at: true,
          last_login_at: true,
          email_verified_at: true,
        },
      });

      if (!user) {
        return response.notFound(req, res, i18nService.translate('users.not_found', language));
      }

      return response.success(
        req,
        res,
        user,
        i18nService.translate('users.profile_retrieved', language),
      );
    } catch (error: any) {
      log.error('Erreur lors de la récupération du profil', {
        userId,
        error: error.message,
        stack: error.stack,
        language,
      });

      return response.serverError(
        req,
        res,
        i18nService.translate('errors.server_error', language),
        error,
      );
    }
  },
);

export { getProfile, updateProfile };
