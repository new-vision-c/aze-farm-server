import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/Mail/send-mail';
import log from '@/services/logging/logger';
import { asyncHandler, response, validateRequiredFields } from '@/utils/responses/helpers';

import { invalidateUserCache } from '../_cache/user-cache';

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

      // Récupérer l'email depuis le token JWT décodé (ajouté par le middleware d'authentification)
      const email = req.user?.email;

      log.info(`OTP verification attempt`, { email, otp });

      if (!email) {
        return response.unauthorized(req, res, 'Invalid or missing token');
      }

      const validation = validateRequiredFields({ otp }, ['otp']);
      if (!validation.valid) {
        return response.badRequest(
          req,
          res,
          `Missing required field(s): ${validation.missing.join(', ')}`,
        );
      }

      // Get user from database (bypass cache for OTP verification)
      const user = await prisma.users.findFirst({
        where: { email, is_deleted: false },
      });

      if (!user) {
        return response.notFound(req, res, 'User not found');
      }

      log.info(`User found`, {
        userId: user.user_id,
        isVerified: user.is_verified,
        otpCode: user.otp?.code,
      });

      if (user.is_verified) {
        return response.conflict(req, res, 'User already verified');
      }

      // Check OTP validity
      if (user.otp?.code !== otp) {
        return response.forbidden(req, res, 'Invalid OTP code');
      }

      // Check OTP expiration
      const now = new Date();
      if (user.otp?.expire_at && user.otp.expire_at < now) {
        return response.forbidden(req, res, 'OTP has expired');
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

      return response.ok(req, res, { email }, 'Account verified successfully');
    } catch (error: any) {
      log.error('OTP verification error', { error: error.message, stack: error.stack });
      return response.serverError(req, res, 'Verification failed');
    }
  },
);

export default verify_otp;
