/**
 * Service Google OAuth
 * Gère l'authentification OAuth2.0 avec Google
 *
 * Ce service implémente le flux OAuth 2.0 pour Google :
 * 1. Récupération du profil utilisateur via l'API Google
 * 2. Révocation des tokens d'accès
 *
 * Configuration requise dans .env :
 * - GOOGLE_CLIENT_ID : ID client OAuth Google
 * - GOOGLE_CLIENT_SECRET : Secret client OAuth Google
 * - GOOGLE_REDIRECT_URI : URL de callback après autorisation
 */
import { envs } from '@/config/env/env';
import { OAUTH_SCOPES, OAUTH_URLS } from '@/core/constant/oauth.constant';
import { type IOAuthUserProfile, OAuthProvider } from '@/core/interface/oauth.interface';
import log from '@/services/logging/logger';

import { BaseOAuthService } from '../base-oauth.service';

/**
 * Interface pour les informations utilisateur retournées par l'API Google
 * Documentation : https://developers.google.com/identity/protocols/oauth2
 */
interface GoogleUserInfo {
  id: string; // Identifiant unique Google de l'utilisateur
  email: string; // Adresse email de l'utilisateur
  verified_email: boolean; // Indique si l'email est vérifié par Google
  name: string; // Nom complet de l'utilisateur
  given_name: string; // Prénom
  family_name: string; // Nom de famille
  picture: string; // URL de la photo de profil
  locale: string; // Préférence de langue (ex: 'fr')
}

export class GoogleOAuthService extends BaseOAuthService {
  constructor() {
    super({
      clientId: envs.GOOGLE_CLIENT_ID,
      clientSecret: envs.GOOGLE_CLIENT_SECRET,
      redirectUri: envs.GOOGLE_REDIRECT_URI,
      authorizationUrl: OAUTH_URLS.GOOGLE.AUTHORIZATION,
      tokenUrl: OAUTH_URLS.GOOGLE.TOKEN,
      userInfoUrl: OAUTH_URLS.GOOGLE.USER_INFO,
      scope: OAUTH_SCOPES.GOOGLE,
    });
  }

  /**
   * Récupère le profil utilisateur depuis l'API Google
   * @param accessToken - Token d'accès OAuth fourni par Google
   * @returns Profil utilisateur normalisé pour l'application
   * @throws Erreur si la récupération échoue
   */
  async getUserProfile(accessToken: string): Promise<IOAuthUserProfile> {
    try {
      // Appel à l'API Google UserInfo avec le token d'accès
      const response = await this.httpClient.get<GoogleUserInfo>(this.config.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userData = response.data;

      return {
        provider: OAuthProvider.GOOGLE,
        provider_user_id: userData.id,
        email: userData.email,
        email_verified: userData.verified_email,
        first_name: userData.given_name || '',
        last_name: userData.family_name || '',
        full_name: userData.name,
        avatar_url: userData.picture,
        locale: userData.locale,
        raw_profile: userData,
      };
    } catch (error: any) {
      log.error('Failed to fetch Google user profile', {
        error: error.message,
      });
      throw new Error('Failed to fetch user information from Google');
    }
  }

  /**
   * Révoque un token d'accès Google
   * Utilisé lors de la déconnexion ou de la suppression de compte
   * @param token - Token d'accès ou de rafraîchissement à révoquer
   */
  async revokeToken(token: string): Promise<void> {
    try {
      // Appel à l'endpoint de révocation Google
      await this.httpClient.post(OAUTH_URLS.GOOGLE.REVOKE, null, {
        params: { token },
      });
      log.info('Token Google révoqué avec succès');
    } catch (error: any) {
      log.error('Failed to revoke Google token', {
        error: error.message,
      });
    }
  }
}
