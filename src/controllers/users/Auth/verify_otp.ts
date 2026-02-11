import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/Mail/send-mail';
import log from '@/services/logging/logger';
import { I18nService } from '@/services/I18nService';
import { asyncHandler, response, validateRequiredFields } from '@/utils/responses/helpers';

import { invalidateUserCache } from '../_cache/user-cache';

// Instance du service d'internationalisation
const i18n = new I18nService();

// Interface pour étendre Request avec user
interface AuthenticatedRequest extends Request {
  user?: {
    user_id: string;
    email: string;
    step: string;
    type: string;
    iat: number;
    exp: number;
  };
}

//& Verify Account (OTP)
const verify_otp = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    try {
      const { otp } = req.body;
      const language = (req as any).language || 'fr';

      // Récupérer l'email depuis le token JWT décodé (ajouté par le middleware d'authentification)
      const email = req.user?.email;

      log.info(`OTP verification attempt`, { email, otp });

      if (!email) {
        return response.unauthorized(req, res, i18n.translate('auth.token_invalid', language));
      }

      const validation = validateRequiredFields({ otp }, ['otp']);
      if (!validation.valid) {
        return response.badRequest(
          req,
          res,
          i18n.translate('validation.otp_required', language),
        );
      }

      // Get user from database (bypass cache for OTP verification)
      const user = await prisma.users.findFirst({
        where: { email, is_deleted: false },
      });

      if (!user) {
        return response.notFound(req, res, i18n.translate('users.not_found', language));
      }

      log.info(`User found`, {
        userId: user.user_id,
        isVerified: user.is_verified,
        otpCode: user.otp?.code,
      });

      if (user.is_verified) {
        return response.conflict(req, res, i18n.translate('auth.user_already_verified', language));
      }

      // Check OTP validity
      if (user.otp?.code !== otp) {
        return response.forbidden(req, res, i18n.translate('auth.otp_invalid', language));
      }

      // Check OTP expiration
      const now = new Date();
      if (user.otp?.expire_at && user.otp.expire_at < now) {
        return response.forbidden(req, res, i18n.translate('auth.otp_expired', language));
      }

      // Verify user
      await prisma.users.update({
        where: { user_id: user.user_id },
        data: { is_verified: true, otp: null, email_verified_at: now },
      });

      // Invalidate cache (optional - skip if Redis fails)
      try {
        await invalidateUserCache(user.user_id, email);
      } catch (cacheError: any) {
        log.warn('Failed to invalidate cache, but continuing...', { error: cacheError.message });
      }

      // Send welcome email (non-blocking)
      const user_full_name = `${user.fullname} `;

      send_mail(email, MAIL.WELCOME_SUBJECT, 'welcome', {
        name: user_full_name,
      }).catch((error) => {
        log.warn('Failed to send welcome email', { email, error: error.message });
      });

      log.info('User verified successfully', { userId: user.user_id, email });

      return response.ok(req, res, { email }, i18n.translate('auth.verification_success', language));
    } catch (error: any) {
      log.error('OTP verification error', { error: error.message, stack: error.stack });
      return response.serverError(req, res, i18n.translate('server.error', language));
    }
  },
);

export default verify_otp;
