/**
 * OAuth Manager Service
 * Central service to manage Google OAuth provider only
 */
import crypto from 'crypto';

import prisma from '@/config/prisma/prisma';
import { OAUTH_ERRORS, OAUTH_STATE_TTL } from '@/core/constant/oauth.constant';
import type {
  IOAuthAccountData,
  IOAuthService,
  IOAuthState,
  IOAuthTokenResponse,
  IOAuthUserProfile,
} from '@/core/interface/oauth.interface';
import { OAuthProvider } from '@/core/interface/oauth.interface';
import log from '@/services/logging/logger';

import { GoogleOAuthService } from './providers/google-oauth.service';

export class OAuthManager {
  private providers: Map<OAuthProvider, IOAuthService>;

  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  /**
   * Initialize Google OAuth provider only
   */
  private initializeProviders(): void {
    try {
      this.providers.set(OAuthProvider.GOOGLE, new GoogleOAuthService());

      log.info('Google OAuth provider initialized successfully');
    } catch (error: any) {
      log.error('Failed to initialize OAuth providers', {
        error: error.message,
      });
    }
  }

  /**
   * Get OAuth service for a specific provider
   */
  getProvider(provider: OAuthProvider): IOAuthService {
    const service = this.providers.get(provider);
    if (!service) {
      throw new Error(OAUTH_ERRORS.PROVIDER_NOT_CONFIGURED);
    }
    return service;
  }

  /**
   * Generate OAuth state parameter for CSRF protection
   */
  generateState(redirectUrl?: string): IOAuthState {
    const state: IOAuthState = {
      state: crypto.randomBytes(32).toString('hex'),
      redirect_url: redirectUrl,
      timestamp: Date.now(),
    };
    return state;
  }

  /**
   * Verify OAuth state parameter
   */
  verifyState(stateData: IOAuthState): boolean {
    const age = Date.now() - stateData.timestamp;
    return age <= OAUTH_STATE_TTL;
  }

  /**
   * Get authorization URL for a provider
   */
  getAuthorizationUrl(provider: OAuthProvider, state: string): string {
    const service = this.getProvider(provider);
    return service.getAuthorizationUrl(state);
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(provider: OAuthProvider, code: string): Promise<IOAuthTokenResponse> {
    const service = this.getProvider(provider);
    return service.exchangeCodeForToken(code);
  }

  /**
   * Get user profile from provider
   */
  async getUserProfile(provider: OAuthProvider, accessToken: string): Promise<IOAuthUserProfile> {
    const service = this.getProvider(provider);
    return service.getUserProfile(accessToken);
  }

  /**
   * Find or create user from OAuth profile
   */
  async findOrCreateUser(
    profile: IOAuthUserProfile,
    tokenData: IOAuthTokenResponse,
  ): Promise<{ user: any; isNewUser: boolean }> {
    try {
      // Check if OAuth account already exists
      const existingOAuthAccount = await prisma.oauth_account.findFirst({
        where: {
          provider: profile.provider,
          provider_user_id: profile.provider_user_id,
        },
        include: {
          user: true,
        },
      });

      if (existingOAuthAccount) {
        // Update OAuth account tokens
        await this.updateOAuthAccount(existingOAuthAccount.id, tokenData);

        return {
          user: existingOAuthAccount.user,
          isNewUser: false,
        };
      }

      // Check if user exists with this email
      let user = await prisma.users.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        // Link OAuth account to existing user
        await this.createOAuthAccount(user.user_id, profile, tokenData);

        return {
          user,
          isNewUser: false,
        };
      }

      // Create new user with OAuth account
      user = await prisma.users.create({
        data: {
          email: profile.email,
          fullname:
            profile.first_name && profile.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile.first_name || profile.last_name || '',
          avatar_url: profile.avatar_url,
          is_verified: profile.email_verified || false,
          is_active: true,
          email_verified_at: profile.email_verified ? new Date() : null,
          oauth_accounts: {
            create: {
              provider: profile.provider,
              provider_user_id: profile.provider_user_id,
              provider_email: profile.email,
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
              token_type: tokenData.token_type,
              expires_at: tokenData.expires_in
                ? new Date(Date.now() + tokenData.expires_in * 1000)
                : null,
              scope: tokenData.scope,
              provider_profile_data: profile.raw_profile,
            },
          },
        },
      });

      log.info('New user created via OAuth', {
        provider: profile.provider,
        email: profile.email,
      });

      return {
        user,
        isNewUser: true,
      };
    } catch (error: any) {
      log.error('Failed to find or create user from OAuth', {
        provider: profile.provider,
        error: error.message,
      });
      throw new Error(OAUTH_ERRORS.ACCOUNT_LINKING_FAILED);
    }
  }

  /**
   * Create OAuth account for existing user
   */
  private async createOAuthAccount(
    userId: string,
    profile: IOAuthUserProfile,
    tokenData: IOAuthTokenResponse,
  ): Promise<void> {
    await prisma.oauth_account.create({
      data: {
        user_id: userId,
        provider: profile.provider,
        provider_user_id: profile.provider_user_id,
        provider_email: profile.email,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type,
        expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        scope: tokenData.scope,
        provider_profile_data: profile.raw_profile,
      },
    });

    log.info('OAuth account linked to existing user', {
      provider: profile.provider,
      userId,
    });
  }

  /**
   * Update OAuth account tokens
   */
  private async updateOAuthAccount(
    accountId: string,
    tokenData: IOAuthTokenResponse,
  ): Promise<void> {
    await prisma.oauth_account.update({
      where: { id: accountId },
      data: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || undefined,
        token_type: tokenData.token_type,
        expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        scope: tokenData.scope,
      },
    });
  }

  /**
   * Unlink OAuth account from user
   */
  async unlinkOAuthAccount(userId: string, provider: OAuthProvider): Promise<void> {
    try {
      const oauthAccount = await prisma.oauth_account.findFirst({
        where: {
          user_id: userId,
          provider: provider,
        },
      });

      if (oauthAccount) {
        await prisma.oauth_account.delete({
          where: { id: oauthAccount.id },
        });
      }

      log.info('OAuth account unlinked', { userId, provider });
    } catch (error: any) {
      log.error('Failed to unlink OAuth account', {
        userId,
        provider,
        error: error.message,
      });
      throw new Error('Failed to unlink OAuth account');
    }
  }

  /**
   * Get user's OAuth accounts
   */
  async getUserOAuthAccounts(userId: string): Promise<IOAuthAccountData[]> {
    const accounts = await prisma.oauth_account.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        provider: true,
        provider_user_id: true,
        provider_email: true,
        created_at: true,
        updated_at: true,
      },
    });

    return accounts as any;
  }

  /**
   * Refresh OAuth access token
   */
  async refreshAccessToken(userId: string, provider: OAuthProvider): Promise<string> {
    try {
      const oauthAccount = await prisma.oauth_account.findFirst({
        where: {
          user_id: userId,
          provider: provider,
        },
      });

      if (!oauthAccount?.refresh_token) {
        throw new Error('No refresh token available');
      }

      const service = this.getProvider(provider);
      const tokenData = await service.refreshAccessToken!(oauthAccount.refresh_token);

      await this.updateOAuthAccount(oauthAccount.id, tokenData);

      return tokenData.access_token;
    } catch (error: any) {
      log.error('Failed to refresh OAuth token', {
        userId,
        provider,
        error: error.message,
      });
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Handle authentication
   */
  async authenticate(provider: OAuthProvider): Promise<void> {
    // Implementation for Google OAuth only
    const service = this.getProvider(provider);
    if (!service) {
      throw new Error(`Provider ${provider} not supported`);
    }
  }
}

// Export singleton instance
export const oauthManager = new OAuthManager();
