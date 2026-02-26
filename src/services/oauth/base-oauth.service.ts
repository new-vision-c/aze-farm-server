/**
 * Service OAuth de Base
 * Classe abstraite qui fournit les fonctionnalités OAuth 2.0 communes
 *
 * Cette classe implémente le flux Authorization Code Grant de OAuth 2.0 :
 * - Génération de l'URL d'autorisation
 * - Échange du code contre un token d'accès
 * - Rafraîchissement du token d'accès
 * - Révocation du token
 *
 * Chaque fournisseur (Google, Apple, etc.) doit implémenter getUserProfile()
 */
import type { AxiosInstance } from 'axios';
import axios from 'axios';

import type {
  IOAuthProviderConfig,
  IOAuthService,
  IOAuthTokenResponse,
  IOAuthUserProfile,
} from '@/core/interface/oauth.interface';
import log from '@/services/logging/logger';

export abstract class BaseOAuthService implements IOAuthService {
  protected config: IOAuthProviderConfig;
  protected httpClient: AxiosInstance;

  constructor(config: IOAuthProviderConfig) {
    this.config = config;
    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Génère l'URL d'autorisation OAuth
   * Redirige l'utilisateur vers la page de consentement du fournisseur
   *
   * @param state - Paramètre d'état pour la protection CSRF
   * @returns URL d'autorisation complète
   */
  getAuthorizationUrl(state: string): string {
    // Construire les paramètres de la requête d'autorisation
    // access_type=offline : permet d'obtenir un refresh token
    // prompt=consent : force l'affichage de l'écran de consentement
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope.join(' '),
      state,
      access_type: 'offline', // For refresh tokens
      prompt: 'consent',
    });

    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Échange le code d'autorisation contre un token d'accès
   * Appelé après que l'utilisateur a autorisé l'application
   *
   * @param code - Code d'autorisation retourné par le fournisseur
   * @returns Tokens d'accès et de rafraîchissement
   * @throws Erreur si l'échange échoue
   */
  async exchangeCodeForToken(code: string): Promise<IOAuthTokenResponse> {
    try {
      const response = await this.httpClient.post<IOAuthTokenResponse>(
        this.config.tokenUrl,
        {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      log.error('Token exchange failed', {
        provider: this.config,
        error: error.message,
      });
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  /**
   * Récupère le profil utilisateur depuis le fournisseur OAuth
   * Doit être implémenté par chaque fournisseur spécifique
   *
   * @param accessToken - Token d'accès OAuth
   * @returns Profil utilisateur normalisé
   */
  abstract getUserProfile(accessToken: string): Promise<IOAuthUserProfile>;

  /**
   * Rafraîchit le token d'accès en utilisant le refresh token
   * Permet de maintenir la session sans redemander l'autorisation
   *
   * @param refreshToken - Token de rafraîchissement
   * @returns Nouveaux tokens d'accès et de rafraîchissement
   * @throws Erreur si le rafraîchissement échoue
   */
  async refreshAccessToken(refreshToken: string): Promise<IOAuthTokenResponse> {
    try {
      const response = await this.httpClient.post<IOAuthTokenResponse>(
        this.config.tokenUrl,
        {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      log.error('Token refresh failed', {
        error: error.message,
      });
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Révoque un token OAuth
   * À surcharger dans les fournisseurs qui supportent la révocation
   *
   * @param _token - Token à révoquer (accès ou rafraîchissement)
   */
  async revokeToken(_token: string): Promise<void> {
    // À surcharger dans les fournisseurs spécifiques si supporté
    log.warn('Révocation de token non implémentée pour ce fournisseur');
  }
}
