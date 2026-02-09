/**
 * Apple OAuth Service
 * Handles Apple Sign In OAuth2.0 authentication
 */
import { envs } from '@/config/env/env';
import { OAUTH_SCOPES, OAUTH_URLS } from '@/core/constant/oauth.constant';
import { type IOAuthUserProfile, OAuthProvider } from '@/core/interface/oauth.interface';
import log from '@/services/logging/logger';

import { BaseOAuthService } from '../base-oauth.service';

interface AppleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  is_private_email: boolean;
  name?: {
    firstName: string;
    lastName: string;
  };
}

export class AppleOAuthService extends BaseOAuthService {
  constructor() {
    super({
      clientId: envs.APPLE_CLIENT_ID,
      clientSecret: envs.APPLE_CLIENT_SECRET,
      redirectUri: envs.APPLE_REDIRECT_URI,
      authorizationUrl: OAUTH_URLS.APPLE.AUTHORIZATION,
      tokenUrl: OAUTH_URLS.APPLE.TOKEN,
      userInfoUrl: OAUTH_URLS.APPLE.USER_INFO,
      scope: OAUTH_SCOPES.APPLE,
    });
  }

  async getUserProfile(accessToken: string): Promise<IOAuthUserProfile> {
    try {
      const response = await this.httpClient.post<AppleUserInfo>(
        this.config.userInfoUrl,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const userData = response.data;

      return {
        provider: OAuthProvider.APPLE,
        provider_user_id: userData.sub,
        email: userData.email,
        email_verified: userData.email_verified,
        first_name: userData.name?.firstName || '',
        last_name: userData.name?.lastName || '',
        full_name: userData.name
          ? `${userData.name.firstName} ${userData.name.lastName}`.trim()
          : '',
        avatar_url: undefined, // Apple ne fournit pas d'avatar
        locale: undefined,
        raw_profile: userData,
      };
    } catch (error: any) {
      log.error('Failed to fetch Apple user profile', {
        error: error.message,
      });
      throw new Error('Failed to fetch user information from Apple');
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      await this.httpClient.post(OAUTH_URLS.APPLE.REVOKE, null, {
        params: { token },
      });
      log.info('Apple token revoked successfully');
    } catch (error: any) {
      log.error('Failed to revoke Apple token', {
        error: error.message,
      });
    }
  }
}
