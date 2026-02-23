import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import prisma from '@/config/prisma/prisma';
import { AuthService } from '@/services/AuthService';
import { I18nService } from '@/services/I18nService';
import userToken from '@/services/jwt/functions-jwt';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/setSafeCookie';

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

      // Générer les tokens et mettre les cookies SEULEMENT si succès réel
      const accessToken = result.token; // Token déjà généré par le service
      const refreshToken = userToken.refreshToken(result.user);

      // Set cookies
      res.setHeader('authorization', `Bearer ${accessToken}`);
      setSafeCookie(res, 'refresh_token', refreshToken, {
        secure: envs.COOKIE_SECURE as boolean,
        httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
        sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      });
      log.info('Set authorization header and refresh token cookie for OTP verification', {
        email: result.user.email,
      });

      return response.success(
        req,
        res,
        {
          step: result.step,
          user: result.user,
          token: accessToken,
          refreshToken,
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
