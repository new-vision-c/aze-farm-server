import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import prisma from '@/config/prisma/prisma';
// import { MAIL } from '@/core/constant/global';
import { AuthService } from '@/services/AuthService';
import { I18nService } from '@/services/I18nService';
// import send_mail from '@/services/Mail/send-mail';
import userToken from '@/services/jwt/functions-jwt';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/setSafeCookie';

//& Login
const login = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
  const { email, password } = req.body;

  // Détecter la langue depuis le header ou utiliser le français par défaut
  const acceptLanguage = req.headers['accept-language'] as string;
  const i18nService = new I18nService();
  const language = i18nService.detectLanguage(acceptLanguage) as 'fr' | 'en';

  // Initialiser le service d'authentification
  const authService = new AuthService(prisma, i18nService);

  try {
    // Utiliser le nouveau service d'authentification
    const result = await authService.login(email, password, language);

    if (!result.success) {
      return response.unauthorized(req, res, result.message);
    }

    // Générer les tokens avec le système existant
    const accessToken = userToken.accessToken(result.user);
    const refreshToken = userToken.refreshToken(result.user);

    // Transaction pour la mise à jour et les cookies
    await prisma.$transaction(async (_tx) => {
      // Set cookies
      res.setHeader('authorization', `Bearer ${accessToken}`);
      setSafeCookie(res, envs.JWT_SECRET, refreshToken, {
        secure: envs.COOKIE_SECURE as boolean,
        httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
        sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      });
      log.info('Set authorization header and refresh token cookie', { email });

      // L'utilisateur est déjà marqué comme actif dans le service
      log.info('User logged in successfully', { email: result.user.email });
    });

    // // Envoyer l'email d'alerte de connexion (non-bloquant)
    // send_mail(email, MAIL.LOGIN_ALERT_SUBJECT, 'alert_login', {
    //   name: result.user.fullname,
    //   date: new Date(),
    // }).catch((error) => {
    //   log.warn('Failed to send login alert email', { email, error: error.message });
    // });

    // Retourner la réponse
    return response.ok(
      req,
      res,
      {
        id: result.user.user_id,
        email: result.user.email,
        fullname: result.user.fullname,
        profile_url: result.user.avatar_url,
        role: result.user.role,
        is_verified: result.user.is_verified,
        is_active: result.user.is_active,
      },
      result.message,
    );
  } catch (error: any) {
    log.error('Login error:', error);
    return response.serverError(req, res, i18nService.translate('server.error', language));
  }
});

export default login;
