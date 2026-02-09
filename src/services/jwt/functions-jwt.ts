import jwt from 'jsonwebtoken';

import { envs } from '@/config/env/env';
import type { IusersJwt } from '@/core/interface/global';
import { readFileSync } from '@/utils/fsUtils';

const userToken = {
  accessToken: (payload: IusersJwt): string => {
    const signOption: jwt.SignOptions = {
      algorithm: envs.JWT_ALGORITHM as jwt.Algorithm,
      expiresIn: envs.JWT_ACCESS_EXPIRES_IN as any,
    };

    return jwt.sign(payload, envs.JWT_SECRET, signOption) as string;
  },

  verifyAccessToken: (token: string) => {
    try {
      return jwt.verify(token, envs.JWT_SECRET) as IusersJwt;
    } catch (error) {
      throw new Error(`Failed to verify access token: ${error}`);
    }
  },

  refreshToken: (payload: IusersJwt): string => {
    const signOption: jwt.SignOptions = {
      algorithm: envs.JWT_ALGORITHM as jwt.Algorithm,
      expiresIn: envs.JWT_REFRESH_EXPIRES_IN as any,
    };

    return jwt.sign(payload, envs.JWT_SECRET, signOption);
  },

  verifyRefreshToken: (refreshToken: string) => {
    try {
      return jwt.verify(refreshToken, envs.JWT_SECRET) as IusersJwt;
    } catch (error) {
      throw new Error(`Failed to verify refresh token: ${error}`);
    }
  },

  decodeToken: (token: string) => {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error(`Failed to decode token: ${error}`);
    }
  },

  generatePasswordResetToken: (userId: string): string => {
    const payload = { userId, type: 'password_reset' };
    const signOption: jwt.SignOptions = {
      algorithm: envs.JWT_ALGORITHM as jwt.Algorithm,
      expiresIn: '1h' as any, // Reset token expires in 1 hour
    };

    return jwt.sign(payload, readFileSync(envs.JWT_PRIVATE_KEY_PATH) || '', signOption) as string;
  },

  refreshAccessToken: async (
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken?: string } | null> => {
    try {
      // Vérifier le refresh token
      const decoded = userToken.verifyRefreshToken(refreshToken);

      if (!decoded || !decoded.user_id) {
        throw new Error('Invalid refresh token payload');
      }

      // Générer un nouvel access token avec toutes les propriétés du decoded token
      const newAccessToken = userToken.accessToken(decoded as IusersJwt);

      // Optionnellement générer un nouveau refresh token pour la rotation
      const newRefreshToken = userToken.refreshToken(decoded as IusersJwt);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      return null;
    }
  },

  verifyPasswordResetToken: (token: string): { userId: string; type: string } => {
    try {
      const decoded = jwt.verify(token, readFileSync(envs.JWT_PUBLIC_KEY_PATH) || '') as any;
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error(`Failed to verify password reset token: ${error}`);
    }
  },
};

export default userToken;
