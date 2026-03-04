import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { invalidateUserCache } from '../_cache/user-cache';
import { uploadAvatar } from '../_utils/avatarUploader';

const update_user_avatar = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const user = (req as any).user;

    if (!user) {
      return response.unauthorized(req, res, 'User not authenticated');
    }

    // Check if avatar file is provided
    if (!req.file) {
      return response.badRequest(req, res, 'Avatar file is required');
    }

    // Handle avatar upload
    const avatar_url = await uploadAvatar(req.file);

    // Update user avatar
    const updatedUser = await prisma.users.update({
      where: { user_id: user.user_id },
      data: { avatar_url },
      select: {
        user_id: true,
        email: true,
        fullname: true,
        avatar_url: true,
      },
    });

    // Invalidate cache
    await invalidateUserCache(user.user_id, updatedUser.email);

    log.info('User avatar updated', { userId: user.user_id });

    return response.ok(req, res, updatedUser, 'Avatar updated successfully');
  },
);

export default update_user_avatar;
