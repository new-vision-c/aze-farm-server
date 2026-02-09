import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { AuthService } from '@/services/AuthService';
import { I18nService } from '@/services/I18nService';
import { asyncHandler, response } from '@/utils/responses/helpers';

//& Vérification OTP (Étape 2)
const verifyOtp = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { otp } = req.body;
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    // Détecter la langue depuis le header ou utiliser le français par défaut
    const acceptLanguage = req.headers['accept-language'] as string;
    const i18nService = new I18nService();
    const language = i18nService.detectLanguage(acceptLanguage) as 'fr' | 'en';

    // Initialiser le service d'authentification
    const authService = new AuthService(prisma, i18nService);

    try {
      // Validation des entrées
      if (!otp) {
        return response.badRequest(
          req,
          res,
          i18nService.translate('validation.otp_required', language),
        );
      }

      if (!sessionToken) {
        return response.unauthorized(
          req,
          res,
          i18nService.translate('auth.token_required', language),
        );
      }

      // Étape 2: Vérifier l'OTP et générer le token définitif
      const result = await authService.verifyOtp(sessionToken, otp, language);

      if (!result.success) {
        return response.badRequest(req, res, result.message);
      }

      return response.success(
        req,
        res,
        {
          step: result.step,
          user: result.user,
          token: result.token,
          registrationCompleted: result.registrationCompleted,
          nextAction: result.nextAction,
          message: result.message,
        },
        result.message,
      );
    } catch (error: any) {
      console.error('OTP verification error:', error);
      return response.serverError(req, res, i18nService.translate('server.error', language));
    }
  },
);

export default verifyOtp;
