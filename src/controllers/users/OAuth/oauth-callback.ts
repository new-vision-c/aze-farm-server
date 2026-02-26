/**
 * Contrôleur de Callback OAuth
 * Gère le retour du fournisseur OAuth après autorisation utilisateur
 *
 * Flux de callback :
 * 1. Vérification de l'état CSRF (protection contre les attaques)
 * 2. Échange du code d'autorisation contre un token d'accès
 * 3. Récupération du profil utilisateur depuis Google
 * 4. Création ou mise à jour de l'utilisateur en base de données
 * 5. Génération des tokens JWT et envoi des emails de bienvenue/alerte
 */
import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import { MAIL } from '@/core/constant/global';
import { OAUTH_COOKIES, OAUTH_ERRORS } from '@/core/constant/oauth.constant';
import type { IOAuthCallbackQuery, IOAuthState } from '@/core/interface/oauth.interface';
import { OAuthProvider } from '@/core/interface/oauth.interface';
import send_mail from '@/services/Mail/send-mail';
import userToken from '@/services/jwt/functions-jwt';
import log from '@/services/logging/logger';
import { oauthManager } from '@/services/oauth/oauth-manager.service';
import { asyncHandler, response } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/setSafeCookie';

/**
 * Gère le callback OAuth depuis le fournisseur
 * GET /auth/oauth/:provider/callback
 *
 * @param provider - Nom du fournisseur OAuth (google)
 * @param code - Code d'autorisation retourné par Google
 * @param state - Paramètre d'état pour vérification CSRF
 * @returns Redirection vers l'application cliente avec tokens ou réponse JSON
 */
const oauth_callback = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { provider } = req.params;
    const { code, state, error, error_description } = req.query as IOAuthCallbackQuery;

    // Validate provider
    const providerUpper = provider.toUpperCase() as OAuthProvider;
    if (!Object.values(OAuthProvider).includes(providerUpper)) {
      return response.badRequest(req, res, OAUTH_ERRORS.INVALID_PROVIDER);
    }

    // Vérifier la présence d'erreurs retournées par Google
    // (ex: accès_refusé, erreur_serveur)
    if (error) {
      log.error('OAuth provider returned error', {
        provider: providerUpper,
        error,
        error_description,
      });

      return response.badRequest(req, res, error_description || 'OAuth authorization failed');
    }

    // Valider le code d'autorisation (requis pour l'échange de token)
    if (!code) {
      return response.badRequest(req, res, OAUTH_ERRORS.MISSING_CODE);
    }

    try {
      // Vérifier le paramètre d'état pour la protection CSRF
      // L'état doit correspondre à celui stocké dans le cookie
      const stateCookie = req.cookies[OAUTH_COOKIES.STATE];
      if (!stateCookie || !state) {
        return response.badRequest(req, res, OAUTH_ERRORS.INVALID_STATE);
      }

      const stateData: IOAuthState = JSON.parse(Buffer.from(stateCookie, 'base64').toString());

      if (stateData.state !== state || !oauthManager.verifyState(stateData)) {
        return response.badRequest(req, res, OAUTH_ERRORS.INVALID_STATE);
      }

      // Effacer le cookie d'état (usage unique)
      res.clearCookie(OAUTH_COOKIES.STATE);

      // Échanger le code d'autorisation contre un token d'accès
      const tokenData = await oauthManager.exchangeCodeForToken(providerUpper, code);

      // Récupérer le profil utilisateur depuis Google
      const userProfile = await oauthManager.getUserProfile(providerUpper, tokenData.access_token);

      // Trouver ou créer l'utilisateur en base de données
      const { user, isNewUser } = await oauthManager.findOrCreateUser(userProfile, tokenData);

      // Générer les tokens JWT pour l'application
      const accessToken = userToken.accessToken(user);
      const refreshToken = userToken.refreshToken(user);

      // Définir les cookies d'authentification
      // Le refresh token est stocké dans un cookie sécurisé httpOnly
      res.setHeader('authorization', `Bearer ${accessToken}`);
      setSafeCookie(res, envs.JWT_SECRET, refreshToken, {
        secure: envs.COOKIE_SECURE as boolean,
        httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
        sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      });

      log.info('OAuth login successful', {
        provider: providerUpper,
        email: user.email,
        isNewUser,
      });

      // Envoyer un email de bienvenue pour les nouveaux utilisateurs (non-bloquant)
      if (isNewUser) {
        send_mail(user.email, MAIL.WELCOME_SUBJECT, 'welcome', {
          name: user.fullname,
        }).catch((error) => {
          log.warn('Failed to send welcome email', {
            email: user.email,
            error: error.message,
          });
        });
      } else {
        // Envoyer une alerte de connexion pour les utilisateurs existants
        send_mail(user.email, MAIL.LOGIN_ALERT_SUBJECT, 'alert_login', {
          name: user.fullname,
          date: new Date(),
        }).catch((error) => {
          log.warn('Failed to send login alert email', {
            email: user.email,
            error: error.message,
          });
        });
      }

      // Rediriger vers l'application cliente ou retourner une réponse JSON
      // Pour les applications web: redirection avec tokens dans l'URL
      // Pour les API: réponse JSON directe
      const redirectUrl = stateData.redirect_url || envs.CLIENT_URL;

      if (redirectUrl) {
        // Redirect with token in query (for web apps)
        const redirectUrlWithToken = `${redirectUrl}?token=${accessToken}&refresh_token=${refreshToken}`;
        return res.redirect(redirectUrlWithToken);
      }

      // Return JSON response (for API clients)
      return response.ok(
        req,
        res,
        {
          id: user.user_id,
          email: user.email,
          fullname: user.fullname,
          profile_url: user.avatar_url,
          is_new_user: isNewUser,
        },
        `Connexion OAuth réussie via ${providerUpper}`,
      );
    } catch (error: any) {
      log.error('OAuth callback failed', {
        provider: providerUpper,
        error: error.message,
      });

      return response.serverError(req, res, error.message || 'OAuth authentication failed');
    }
  },
);

export default oauth_callback;
