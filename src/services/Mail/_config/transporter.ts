import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import { envs } from '@/config/env/env';
import log from '@/services/logging/logger';

// Configuration SMTP optimisée pour la production avec timeouts et pool
const smtpConfig = {
  host: envs.SMTP_HOST,
  port: envs.SMTP_PORT,
  secure: envs.SMTP_PORT === 465, // true pour SSL (port 465), false pour TLS (port 587)
  auth: {
    user: envs.SMTP_USER,
    pass: envs.SMTP_PASS,
  },
  // Timeouts optimisés pour éviter les "Connection timeout"
  connectionTimeout: envs.SMTP_CONNECTION_TIMEOUT || 10000, // 10 secondes
  socketTimeout: envs.SMTP_SOCKET_TIMEOUT || 60000, // 60 secondes
  greetingTimeout: envs.SMTP_GREET_TIMEOUT || 10000, // 10 secondes

  // Pool de connexions pour meilleure performance
  pool: true, // Activer le pooling
  maxConnections: envs.SMTP_POOL_SIZE || 5,
  maxMessages: 100,
  rateDelta: 1000, // Réinitialiser la limite de débit après 1 seconde
  rateLimit: envs.SMTP_RATE_LIMIT || 5, // Nombre de messages par rateDelta

  // Logging activé en production pour debug Gmail/Render
  logger: true,
  debug: true,

  // Configuration TLS pour Gmail
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false, // Peut aider avec certains problèmes de certificat
  },

  // Ignorer les erreurs TLS (utile pour certains providers)
  ignoreTLS: false,
  requireTLS: true,
};

// Log de configuration SMTP (sans le mot de passe)
log.info('SMTP Configuration initialized', {
  host: envs.SMTP_HOST,
  port: envs.SMTP_PORT,
  secure: smtpConfig.secure,
  user: envs.SMTP_USER,
  poolEnabled: !!smtpConfig.pool,
});

const transporter: Transporter<SMTPTransport.SentMessageInfo> =
  nodemailer.createTransport(smtpConfig);

// Événements de debug pour le transporter
transporter.on('error', (err) => {
  log.error('SMTP Transporter error event', {
    error: err.message,
    code: (err as any).code,
    command: (err as any).command,
  });
});

transporter.on('idle', () => {
  log.debug('SMTP Transporter idle event');
});

export default transporter;
