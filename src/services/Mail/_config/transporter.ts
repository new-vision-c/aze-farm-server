import nodemailer from 'nodemailer';

import { envs } from '@/config/env/env';

// Configuration SMTP optimisée pour la production
const transporter = nodemailer.createTransport({
  host: envs.SMTP_HOST,
  port: envs.SMTP_PORT,
  secure: envs.SMTP_PORT === 465, // true pour SSL (port 465), false pour TLS (port 587)
  auth: {
    user: envs.SMTP_USER,
    pass: envs.SMTP_PASS,
  },
  // Timeouts optimisés pour éviter les "Connection timeout"
  connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '10000'), // 10 secondes
  socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || '60000'), // 60 secondes
  greetingTimeout: parseInt(process.env.SMTP_GREET_TIMEOUT || '10000'), // 10 secondes
  
  // Pool de connexions pour meilleure performance
  pool: true,
  maxConnections: parseInt(process.env.SMTP_POOL_SIZE || '5'),
  maxMessages: 100,
  rateDelta: 1000, // Réinitialiser la limite de débit après 1 seconde
  rateLimit: parseInt(process.env.SMTP_RATE_LIMIT || '5'), // Nombre de messages par rateDelta
  
  // Logging optionnel pour debug
  logger: process.env.NODE_ENV === 'development',
  debug: process.env.NODE_ENV === 'development',
  
  // Retry logic pour les erreurs temporaires
  connectionUrl: undefined, // Utiliser les paramètres individuels au lieu de connectionUrl
});

export default transporter;
