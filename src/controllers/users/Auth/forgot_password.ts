import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import prisma from '@/config/prisma/prisma';
import { MAIL } from '@/core/constant/global';
import { I18nService } from '@/services/I18nService';
import send_mail from '@/services/Mail/send-mail';
import userToken from '@/services/jwt/functions-jwt';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

//& Étape 1: Récupérer l'email et le vérifier, générer un session token
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
        { session_token: 'mock-token-for-security' },
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
          otp: {
            code: otp,
            expire_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          },
          updated_at: new Date(),
        },
      });

      // Générer un session token pour la réinitialisation
      const sessionToken = userToken.generatePasswordResetToken(user.user_id);

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
        { session_token: sessionToken, otp },
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

//& Étape 2: Vérifier l'OTP avec le session token dans le header Authorization
const forgotPasswordStep2 = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { otp } = req.body;
    const authHeader = req.headers.authorization;

    // Détecter la langue depuis le header ou utiliser le français par défaut
    const acceptLanguage = req.headers['accept-language'] as string;
    const i18nService = new I18nService();
    const language = i18nService.detectLanguage(acceptLanguage) as 'fr' | 'en';

    if (!otp) {
      return response.badRequest(
        req,
        res,
        i18nService.translate('validation.otp_required', language),
      );
    }

    if (!authHeader?.startsWith('Bearer ')) {
      return response.unauthorized(
        req,
        res,
        i18nService.translate('auth.bearer_token_required', language),
      );
    }

    const sessionToken = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      // Vérifier et décoder le session token
      const decoded = userToken.verifyPasswordResetToken(sessionToken);

      if (!decoded.userId) {
        return response.unauthorized(
          req,
          res,
          i18nService.translate('auth.invalid_session_token', language),
        );
      }

      // Vérifier l'utilisateur
      const user = await prisma.users.findFirst({
        where: {
          user_id: decoded.userId,
          otp: {
            isSet: true, // Vérifier que l'OTP existe
          },
          is_deleted: false,
        },
      });

      // Vérifier si l'OTP correspond et n'est pas expiré
      if (!user?.otp?.code || user.otp.code !== otp || user.otp.expire_at < new Date()) {
        return response.badRequest(
          req,
          res,
          i18nService.translate('auth.invalid_or_expired_otp', language),
        );
      }

      // Nettoyer l'OTP après utilisation
      await prisma.users.update({
        where: { user_id: user.user_id },
        data: {
          otp: null,
          updated_at: new Date(),
        },
      });

      log.info('OTP vérifié avec succès', { userId: user.user_id, language });

      return response.ok(
        req,
        res,
        { otp_verified: true },
        i18nService.translate('auth.otp_verified_success', language),
      );
    } catch (error: any) {
      log.error("Erreur lors de la vérification de l'OTP", {
        error: error.message,
        stack: error.stack,
        language,
      });

      return response.serverError(req, res, i18nService.translate('errors.server_error', language));
    }
  },
);

//& Étape 3: Récupérer le nouveau mot de passe et le mettre à jour avec le session token
const forgotPasswordStep3 = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { password, passwordConfirm } = req.body;
    const authHeader = req.headers.authorization;

    // Détecter la langue depuis le header ou utiliser le français par défaut
    const acceptLanguage = req.headers['accept-language'] as string;
    const i18nService = new I18nService();
    const language = i18nService.detectLanguage(acceptLanguage) as 'fr' | 'en';

    if (!password || !passwordConfirm) {
      return response.badRequest(
        req,
        res,
        i18nService.translate('validation.all_fields_required', language),
      );
    }

    if (!authHeader?.startsWith('Bearer ')) {
      return response.unauthorized(
        req,
        res,
        i18nService.translate('auth.bearer_token_required', language),
      );
    }

    const sessionToken = authHeader.substring(7); // Remove "Bearer " prefix

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
      const decoded = userToken.verifyPasswordResetToken(sessionToken);

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
        },
      });

      // Mettre à jour la date de dernière connexion
      await prisma.users.update({
        where: { user_id: user.user_id },
        data: { last_login_at: new Date() },
      });

      // Générer le JWT de login définitif (7 jours)
      const loginToken = jwt.sign(
        {
          userId: user.user_id,
          email: user.email,
          fullname: user.fullname,
          role: user.role,
          step: 'authenticated',
          type: 'login',
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' },
      );

      log.info('Mot de passe réinitialisé avec succès', {
        userId: user.user_id,
        email: user.email,
        language,
      });

      return response.ok(
        req,
        res,
        {
          password_updated: true,
          token: loginToken,
          user: {
            user_id: user.user_id,
            email: user.email,
            fullname: user.fullname,
            role: user.role,
            is_verified: user.is_verified,
            is_active: user.is_active,
          },
        },
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
