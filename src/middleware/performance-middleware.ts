import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Configuration du rate limiting par utilisateur
 */
const createRateLimit = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Prioriser l'ID utilisateur si disponible, sinon IP
      return (req as any).userId || req.ip || 'unknown';
    },
    skip: (req: Request) => {
      // Skipper le rate limiting pour les requêtes internes
      return req.path.startsWith('/health') || req.path.startsWith('/metrics');
    },
  });

/**
 * Rate limiting pour l'endpoint de recherche
 */
export const searchRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requêtes par fenêtre
  'Trop de requêtes de recherche. Veuillez réessayer dans 15 minutes.',
);

/**
 * Rate limiting pour les suggestions
 */
export const suggestionsRateLimit = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  20, // 20 suggestions par fenêtre
  'Trop de demandes de suggestions. Veuillez réessayer dans 5 minutes.',
);

/**
 * Rate limiting pour les analytics/tendances
 */
export const trendsRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  5, // 5 requêtes par minute
  "Trop de requêtes d'analytics. Veuillez réessayer dans 1 minute.",
);

/**
 * Middleware de compression des réponses
 */
export const compressionMiddleware = compression({
  filter: (req: Request, res: Response) => {
    // Ne pas compresser si la réponse est déjà compressée
    if (res.headersSent) {
      return false;
    }

    // Ne pas compresser les réponses très petites
    const contentLength = res.get('Content-Length');
    if (contentLength && parseInt(contentLength) < 1024) {
      return false;
    }

    // Compresser uniquement certains types de contenu
    const contentType = res.get('Content-Type');
    const compressibleTypes = [
      'application/json',
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
    ];

    return compressibleTypes.some((type) => contentType?.includes(type));
  },
  threshold: 1024, // Seuil de compression en bytes
  level: 6, // Niveau de compression (1-9, 6 = équilibre)
  chunkSize: 16 * 1024, // 16KB chunks
});

/**
 * Middleware pour ajouter les headers de performance
 */
export const performanceHeaders = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Ajouter le header de timing
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('X-Cache-Status', 'MISS'); // Sera mis à jour par le cache

    // Logger de performance
    if (duration > 1000) {
      // Plus d'1 seconde
      console.warn(`🐌 Requête lente: ${req.method} ${req.path} - ${duration}ms`);
    }
  });

  // Headers de sécurité
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  next();
};

/**
 * Middleware pour détecter les bots et ajuster le rate limiting
 */
export const botDetection = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'] || '';

  // Liste de patterns de bots
  const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i];

  const isBot = botPatterns.some((pattern) => pattern.test(userAgent));

  if (isBot) {
    // Rate limiting plus strict pour les bots
    req.headers['x-is-bot'] = 'true';
    req.headers['x-rate-limit'] = '10/m';
  }

  next();
};
