import { type Express, Router } from 'express';

import { envs } from '@/config/env/env';
import CSP from '@/router/_config/CSP/csp.router';
import CSRF from '@/router/_config/CSRF-token/csrf.router';
import health from '@/router/_config/healtcheck/health.router';
import locationRouter from '@/router/location.router';
import auth from '@/router/users/auth.router';
import oauth from '@/router/users/oauth.router';
import users from '@/router/users/users.router';

import exampleRouter from '../../router/example.router';
import productRouter from '../../router/product.router';
import { rateLimitingSubRoute } from './securityConfig';

const api_version = envs.API_PREFIX || '/api/v1';

const api = Router();

//? program routes
const setupRoutes = (app: Express): void => {
  // Content Security Policy route
  app.use(envs.CSP_REPORT_URI, rateLimitingSubRoute, CSP);

  // CSRF token route
  app.use('/csrf-token', rateLimitingSubRoute, CSRF);

  // Health check routes
  app.use('/health', rateLimitingSubRoute, health);

  // Application routes with rate limiting
  api.use('/auth', rateLimitingSubRoute, auth);
  api.use('/auth/oauth', rateLimitingSubRoute, oauth);
  api.use('/example', rateLimitingSubRoute, exampleRouter);
  api.use('/products', rateLimitingSubRoute, productRouter);
  api.use('/users', rateLimitingSubRoute, users);
  api.use('/location', rateLimitingSubRoute, locationRouter);

  app.use(api_version, api);
};

export default setupRoutes;
