import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { MAIL } from '@/core/constant/global';
import { I18nService } from '@/services/I18nService';
import send_mail from '@/services/Mail/send-mail';
import userToken from '@/services/jwt/functions-jwt';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

//& Étape 1: Récupérer l'email et le vérifier
const forgotPasswordStep1 = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email } = req.body;

    // Détecter la langue depuis le header ou utiliser le français par défaut
    const acceptLanguage = req.headers['accept-language'] as string;
    const i18nService = new I18nService();
    const language = i18nService.detectLanguage(acceptLanguage) as 'fr' | 'en';

    if (!email) {
      return response.badRequest(
        req,
        res,
        i18nService.translate('validation.email_required', language),
      );
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.users.findFirst({
      where: { email, is_deleted: false },
    });

    if (!user) {
      // Pour des raisons de sécurité, ne pas révéler si l'email existe ou non
      return response.ok(
        req,
        res,
        { email_sent: true },
        i18nService.translate('auth.password_reset_sent_if_exists', language),
      );
    }

    try {
      // Générer un OTP pour la réinitialisation
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Mettre à jour l'utilisateur avec l'OTP
      await prisma.users.update({
        where: { user_id: user.user_id },
        data: {
          otp: otp,
          updated_at: new Date(),
        } as any, // Cast pour éviter l'erreur TypeScript
      });

      // Envoyer l'email avec l'OTP
      await send_mail(email, MAIL.RESET_PWD_SUBJECT, 'otp', {
        name: user.fullname,
        otp,
        language,
        otp_email_subject: i18nService.translate('auth.otp_email_subject', language),
        otp_platform_description: i18nService.translate('auth.otp_platform_description', language),
        otp_welcome_message: i18nService.translate('auth.otp_welcome_message', language),
        otp_validity_message: i18nService.translate('auth.otp_validity_message', language),
        otp_thank_you: i18nService.translate('auth.otp_thank_you', language),
      });

      log.info('OTP de réinitialisation envoyé', { email, language });

      return response.ok(
        req,
        res,
        { email_sent: true },
        i18nService.translate('auth.otp_sent_for_password_reset', language),
      );
    } catch (error: any) {
      log.error("Erreur lors de l'envoi de l'OTP de réinitialisation", {
        email,
        error: error.message,
        stack: error.stack,
        language,
      });

      return response.serverError(req, res, i18nService.translate('errors.server_error', language));
    }
  },
);

//& Étape 2: Vérifier l'OTP et générer le session token
const forgotPasswordStep2 = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email, otp } = req.body;

    // Détecter la langue depuis le header ou utiliser le français par défaut
    const acceptLanguage = req.headers['accept-language'] as string;
    const i18nService = new I18nService();
    const language = i18nService.detectLanguage(acceptLanguage) as 'fr' | 'en';

    if (!email || !otp) {
      return response.badRequest(
        req,
        res,
        i18nService.translate('validation.email_and_otp_required', language),
      );
    }

    try {
      // Vérifier l'utilisateur et l'OTP
      const user = await prisma.users.findFirst({
        where: {
          email,
          otp,
          is_deleted: false,
        },
      });

      if (!user) {
        return response.badRequest(
          req,
          res,
          i18nService.translate('auth.invalid_or_expired_otp', language),
        );
      }

      // Générer un session token pour la réinitialisation
      const sessionToken = userToken.generatePasswordResetToken(user.user_id);

      // Nettoyer l'OTP après utilisation
      await prisma.users.update({
        where: { user_id: user.user_id },
        data: {
          otp: null,
          updated_at: new Date(),
        } as any, // Cast pour éviter l'erreur TypeScript
      });

      log.info('Session token de réinitialisation généré', { email, language });

      return response.ok(
        req,
        res,
        { session_token: sessionToken },
        i18nService.translate('auth.session_token_generated', language),
      );
    } catch (error: any) {
      log.error("Erreur lors de la vérification de l'OTP", {
        email,
        error: error.message,
        stack: error.stack,
        language,
      });

      return response.serverError(req, res, i18nService.translate('errors.server_error', language));
    }
  },
);

//& Étape 3: Récupérer le nouveau mot de passe et le mettre à jour
const forgotPasswordStep3 = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { session_token: session_token, password, passwordConfirm } = req.body;

    // Détecter la langue depuis le header ou utiliser le français par défaut
    const acceptLanguage = req.headers['accept-language'] as string;
    const i18nService = new I18nService();
    const language = i18nService.detectLanguage(acceptLanguage) as 'fr' | 'en';

    if (!session_token || !password || !passwordConfirm) {
      return response.badRequest(
        req,
        res,
        i18nService.translate('validation.all_fields_required', language),
      );
    }

    if (password !== passwordConfirm) {
      return response.badRequest(
        req,
        res,
        i18nService.translate('validation.passwords_not_match', language),
      );
    }

    if (password.length < 8) {
      return response.badRequest(
        req,
        res,
        i18nService.translate('validation.password_too_short', language),
      );
    }

    try {
      // Vérifier et décoder le session token
      const decoded = userToken.verifyPasswordResetToken(session_token);

      if (!decoded.userId) {
        return response.unauthorized(
          req,
          res,
          i18nService.translate('auth.invalid_session_token', language),
        );
      }

      // Vérifier que l'utilisateur existe
      const user = await prisma.users.findFirst({
        where: {
          user_id: decoded.userId,
          is_deleted: false,
        },
      });

      if (!user) {
        return response.notFound(req, res, i18nService.translate('users.not_found', language));
      }

      // Hasher le nouveau mot de passe
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Mettre à jour le mot de passe
      await prisma.users.update({
        where: { user_id: user.user_id },
        data: {
          password: hashedPassword,
          updated_at: new Date(),
        } as any, // Cast pour éviter l'erreur TypeScript
      });

      log.info('Mot de passe réinitialisé avec succès', {
        userId: user.user_id,
        email: user.email,
        language,
      });

      return response.ok(
        req,
        res,
        { password_updated: true },
        i18nService.translate('auth.password_reset_success', language),
      );
    } catch (error: any) {
      log.error('Erreur lors de la réinitialisation du mot de passe', {
        error: error.message,
        stack: error.stack,
        language,
      });

      return response.serverError(req, res, i18nService.translate('errors.server_error', language));
    }
  },
);

export { forgotPasswordStep1, forgotPasswordStep2, forgotPasswordStep3 };
