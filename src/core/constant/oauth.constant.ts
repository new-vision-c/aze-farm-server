/**
 * OAuth2.0 Constants
 * Contains all OAuth provider URLs and configuration constants
 */
import { OAuthProvider } from '../interface/oauth.interface';

/**
 * OAuth Provider URLs
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
 * Default OAuth Scopes per Provider
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
 * OAuth Error Messages
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
 * OAuth State TTL (15 minutes)
 */
export const OAUTH_STATE_TTL = 15 * 60 * 1000;

/**
 * OAuth Cookie Names
 */
export const OAUTH_COOKIES = {
  STATE: 'oauth_state',
  REDIRECT: 'oauth_redirect',
} as const;
