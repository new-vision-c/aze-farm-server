import setupSwagger from '@config/swagger/swagger';
import log from '@services/logging/logger';
import initMiddlewares from '@utils/middleware/_initMiddlewares';
import express from 'express';

import health from '@/router/_config/healtcheck/health.router';
import metricsRouter from '@/services/metrics/metrics';

import { initializeServices } from './config/services';
import { i18nRequestMiddleware } from './middlewares/i18nRequest.middleware';
import { scheduler } from './services/scheduler';
import { initNotificationService, initUploader } from './services/scheduler/initDependencies';

const app = express();

// Initialiser les services (incluant l'i18n)
initializeServices();

// Setup Swagger for API documentation
setupSwagger(app);

// Middleware i18n pour détecter la langue et configurer les utilitaires de réponse
app.use(i18nRequestMiddleware);

initMiddlewares(app);

// Metrics endpoint
app.use('/metrics', metricsRouter);

// Health check endpoint
app.use('/health', health);

// Initialize scheduler dependencies
const uploader = initUploader();
const notificationService = initNotificationService();

// Initialize jobs with dependencies
scheduler.init({
  uploader,
  notificationService,
});

// Global error handling for unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', {
    promise,
    reason: reason instanceof Error ? reason.stack : reason,
  });
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error.stack || error);
  throw new Error(`Uncaught Exception:: ${error.message || error}`);
});

export default app;
