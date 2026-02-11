import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import { envs } from '@/config/env/env';

// Configuration SMTP optimisée pour la production avec timeouts et pool
const transporter: Transporter<SMTPTransport.SentMessageInfo> = nodemailer.createTransport({
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
  pool: {
    maxConnections: envs.SMTP_POOL_SIZE || 5,
    maxMessages: 100,
    rateDelta: 1000, // Réinitialiser la limite de débit après 1 seconde
    rateLimit: envs.SMTP_RATE_LIMIT || 5, // Nombre de messages par rateDelta
  },
  
  // Logging optionnel pour debug
  logger: process.env.NODE_ENV === 'development',
  debug: process.env.NODE_ENV === 'development',
} as SMTPTransport.Options);

export default transporter;
