/**
 * Constantes OAuth 2.0
 * Contient toutes les URLs des fournisseurs OAuth et les constantes de configuration
 *
 * Configuration pour :
 * - Google OAuth 2.0
 * - Apple Sign In (préparé mais non implémenté)
 */
import { OAuthProvider } from '../interface/oauth.interface';

/**
 * URLs des fournisseurs OAuth
 * Endpoints pour l'autorisation, l'échange de tokens et les informations utilisateur
 */
export const OAUTH_URLS = {
  [OAuthProvider.GOOGLE]: {
    AUTHORIZATION: 'https://accounts.google.com/o/oauth2/v2/auth',
    TOKEN: 'https://oauth2.googleapis.com/token',
    USER_INFO: 'https://www.googleapis.com/oauth2/v2/userinfo',
    REVOKE: 'https://oauth2.googleapis.com/revoke',
  },
  [OAuthProvider.APPLE]: {
    AUTHORIZATION: 'https://appleid.apple.com/auth/authorize',
    TOKEN: 'https://appleid.apple.com/auth/token',
    USER_INFO: 'https://appleid.apple.com/auth/userinfo',
    REVOKE: 'https://appleid.apple.com/auth/revoke',
  },
} as const;

/**
 * Scopes OAuth par défaut par fournisseur
 * Permissions demandées lors de l'autorisation
 *
 * Google :
 * - openid : authentification OpenID Connect
 * - profile : accès aux informations de profil de base
 * - email : accès à l'adresse email
 */
export const OAUTH_SCOPES = {
  [OAuthProvider.GOOGLE]: [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ],
  [OAuthProvider.APPLE]: ['name', 'email'],
} as const;

/**
 * Messages d'erreur OAuth
 * Utilisés pour la gestion des erreurs dans les contrôleurs
 */
export const OAUTH_ERRORS = {
  INVALID_STATE: 'Invalid OAuth state parameter',
  MISSING_CODE: 'Authorization code not provided',
  TOKEN_EXCHANGE_FAILED: 'Failed to exchange authorization code for token',
  USER_INFO_FAILED: 'Failed to fetch user information from provider',
  ACCOUNT_LINKING_FAILED: 'Failed to link OAuth account',
  PROVIDER_NOT_CONFIGURED: 'OAuth provider is not configured',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
  ACCOUNT_NOT_FOUND: 'OAuth account not found',
  INVALID_PROVIDER: 'Invalid OAuth provider',
} as const;

/**
 * Durée de vie de l'état OAuth (15 minutes)
 * L'état expire après ce délai pour des raisons de sécurité
 */
export const OAUTH_STATE_TTL = 15 * 60 * 1000;

/**
 * Noms des cookies OAuth
 * Utilisés pour stocker l'état et l'URL de redirection
 */
export const OAUTH_COOKIES = {
  STATE: 'oauth_state',
  REDIRECT: 'oauth_redirect',
} as const;
