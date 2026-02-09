import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { AuthService } from '@/services/AuthService';
import { I18nService } from '@/services/I18nService';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { uploadAvatar } from '../_utils/avatarUploader';

//& Inscription (Sign up) - Étape 1
const signup = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
  const { email, password, fullname } = req.body;

  // Détecter la langue depuis le header ou utiliser le français par défaut
  const acceptLanguage = req.headers['accept-language'] as string;
  const i18nService = new I18nService();
  const language = i18nService.detectLanguage(acceptLanguage) as 'fr' | 'en';

  // Initialiser le service d'authentification
  const authService = new AuthService(prisma, i18nService);

  try {
    // Upload avatar si fourni
    const profile_url = await uploadAvatar(req.file);

    // Étape 1: Inscription avec génération OTP
    const result = await authService.registerStep1(
      {
        email,
        password,
        fullname,
      },
      language,
    );

    if (!result.success) {
      return response.badRequest(req, res, result.message);
    }

    // Mettre à jour l'avatar si fourni
    if (profile_url && result.user) {
      await prisma.users.update({
        where: { user_id: result.user.user_id },
        data: { avatar_url: profile_url },
      });
      result.user.avatar_url = profile_url;
    }

    return response.created(
      req,
      res,
      {
        step: result.step,
        user: result.user,
        token: result.token,
        requiresOtp: result.requiresOtp,
        otpCode: result.otpCode, // En développement uniquement
        message: result.message,
      },
      result.message,
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return response.serverError(req, res, i18nService.translate('server.error', language));
  }
});

export default signup;
