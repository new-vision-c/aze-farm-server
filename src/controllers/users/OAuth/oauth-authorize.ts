/**
 * Contrôleur d'Autorisation OAuth
 * Initialise le flux OAuth en redirigeant vers le fournisseur
 *
 * Flux d'autorisation :
 * 1. L'utilisateur clique sur 'Se connecter avec Google'
 * 2. Ce contrôleur génère un état CSRF et redirige vers Google
 * 3. Google demande l'autorisation à l'utilisateur
 * 4. Google redirige vers oauth_callback avec un code d'autorisation
 */
import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import { OAUTH_COOKIES, OAUTH_ERRORS } from '@/core/constant/oauth.constant';
import { OAuthProvider } from '@/core/interface/oauth.interface';
import log from '@/services/logging/logger';
import { oauthManager } from '@/services/oauth/oauth-manager.service';
import { asyncHandler, response } from '@/utils/responses/helpers';

/**
 * Initialise le flux d'autorisation OAuth
 * GET /auth/oauth/:provider
 *
 * @param provider - Nom du fournisseur OAuth (google)
 * @param redirect_url - URL de redirection après connexion (optionnel)
 * @returns Redirection vers la page d'autorisation Google
 */
const oauth_authorize = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { provider } = req.params;
    const { redirect_url } = req.query;

    // Validate provider
    const providerUpper = provider.toUpperCase() as OAuthProvider;
    if (!Object.values(OAuthProvider).includes(providerUpper)) {
      return response.badRequest(req, res, OAUTH_ERRORS.INVALID_PROVIDER);
    }

    try {
      // Générer un état pour la protection CSRF
      // L'état est stocké dans un cookie sécurisé pour vérification ultérieure
      const stateData = oauthManager.generateState(redirect_url as string);
      const stateString = Buffer.from(JSON.stringify(stateData)).toString('base64');

      // Stocker l'état dans un cookie sécurisé (httpOnly, secure, sameSite)
      res.cookie(OAUTH_COOKIES.STATE, stateString, {
        httpOnly: true,
        secure: envs.COOKIE_SECURE as boolean,
        sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      // Get authorization URL from provider
      const authUrl = oauthManager.getAuthorizationUrl(providerUpper, stateData.state);

      log.info('OAuth authorization initiated', {
        provider: providerUpper,
        redirect_url,
      });

      // Redirect to provider's authorization page
      return res.redirect(authUrl);
    } catch (error: any) {
      log.error('OAuth authorization failed', {
        provider: providerUpper,
        error: error.message,
      });

      return response.serverError(
        req,
        res,
        error.message || 'Failed to initiate OAuth authorization',
      );
    }
  },
);

export default oauth_authorize;
