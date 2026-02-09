import type { NextFunction, Request, Response } from 'express';

import blackListToken from '@/services/jwt/black_list';
import userToken from '@/services/jwt/functions-jwt';
import log from '@/services/logging/logger';
import { response } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/setSafeCookie';

/**
 * Middleware to verify if user is authenticated with automatic token refresh
 */
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let accessToken: string | undefined;

    // 1. Essayer l'access token depuis les headers Authorization
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.replace('Bearer ', '');
    }

    // 2. Si pas dans les headers, essayer depuis les cookies
    if (!accessToken) {
      accessToken = req.cookies?.access_token;
    }

    // 3. Si toujours pas de token, essayer le refresh automatique
    if (!accessToken) {
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) {
        try {
          log.debug('Attempting automatic token refresh');
          const newTokens = await userToken.refreshAccessToken(refreshToken);

          if (newTokens?.accessToken) {
            // Mettre à jour les cookies avec les nouveaux tokens
            setSafeCookie(res, 'access_token', newTokens.accessToken, {
              maxAge: 15 * 60 * 1000, // 15 minutes
            });

            if (newTokens.refreshToken) {
              setSafeCookie(res, 'refresh_token', newTokens.refreshToken, {
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
              });
            }

            accessToken = newTokens.accessToken;
            log.info('Automatic token refresh successful');
          }
        } catch (refreshError: any) {
          log.warn('Automatic token refresh failed', { error: refreshError.message });
          // Continuer sans token - sera traité ci-dessous
        }
      }
    }

    // 4. Vérification finale de l'access token
    if (!accessToken) {
      log.warn('No access token available after refresh attempt');
      return response.unauthorized(req, res, 'Authentication required');
    }

    // Check if token is blacklisted
    const isBlacklisted = await blackListToken.isBlackListToken(accessToken);
    if (isBlacklisted) {
      log.warn('Attempted access with blacklisted token');
      return response.unauthorized(req, res, 'Token has been revoked');
    }

    // Verify token validity
    const decoded = userToken.verifyAccessToken(accessToken);
    if (!decoded) {
      log.warn('Invalid access token');
      return response.unauthorized(req, res, 'Invalid access token');
    }

    // Attach user data to request object
    (req as any).user = decoded;
    log.debug('Authentication successful', { userId: decoded.user_id });

    next();
  } catch (error: any) {
    log.error('Authentication error', { error: error.message, stack: error.stack });
    return response.unauthorized(req, res, 'Authentication failed');
  }
};

/**
 * Middleware to verify if user has admin role
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return response.unauthorized(req, res, 'User not authenticated');
    }

    // Check if user has admin role
    if (user.role !== 'ADMIN' && user.role !== 'admin') {
      log.warn('Access denied: User is not an admin', { userId: user.id, role: user.role });
      return response.forbidden(req, res, 'Access denied. Admin privileges required');
    }

    next();
  } catch (error: any) {
    log.error('Admin authorization error', { error: error.message });
    return response.forbidden(req, res, 'Authorization failed');
  }
};

/**
 * Middleware to check if user is verified
 */
export const isVerified = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return response.unauthorized(req, res, 'User not authenticated');
    }

    if (!user.is_verified) {
      return response.forbidden(req, res, 'Account not verified. Please verify your account first');
    }

    next();
  } catch (error: any) {
    log.error('Verification check error', { error: error.message });
    return response.forbidden(req, res, 'Verification check failed');
  }
};

/**
 * Middleware to check if user is active
 */
export const isActive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return response.unauthorized(req, res, 'User not authenticated');
    }

    if (!user.is_active) {
      return response.forbidden(req, res, 'Account is inactive. Please contact support');
    }

    next();
  } catch (error: any) {
    log.error('Active check error', { error: error.message });
    return response.forbidden(req, res, 'Active check failed');
  }
};
