import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import prisma from '@/config/prisma/prisma';
import { response } from '@/utils/responses/helpers';

const healthControllers = {
  // Read
  health: async (_req: Request, res: Response): Promise<void> => {
    try {
      const healthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          api: { status: 'healthy', responseTime: '0ms' },
          database: { status: 'unknown', responseTime: '0ms' },
          cloudinary: { status: 'unknown', responseTime: '0ms' },
          mail: { status: 'unknown', responseTime: '0ms' },
          redis: { status: 'unknown', responseTime: '0ms' },
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
      };

      // Test de la base de données
      const dbStart = Date.now();
      try {
        // Pour MongoDB, on teste une simple opération find
        await prisma.users.findFirst({ take: 1 });
        const dbTime = Date.now() - dbStart;
        healthStatus.services.database = {
          status: 'healthy',
          responseTime: `${dbTime}ms`,
          type: 'mongodb',
        } as any;
      } catch (dbError) {
        healthStatus.services.database = {
          status: 'unhealthy',
          responseTime: `${Date.now() - dbStart}ms`,
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
        } as any;
        healthStatus.status = 'degraded';
      }

      // Test de Cloudinary
      const cloudinaryStart = Date.now();
      try {
        // Importer dynamiquement pour éviter les erreurs si non configuré
        const { v2: cloudinary } = await import('cloudinary');
        await cloudinary.api.ping();
        const cloudinaryTime = Date.now() - cloudinaryStart;
        healthStatus.services.cloudinary = {
          status: 'healthy',
          responseTime: `${cloudinaryTime}ms`,
        };
      } catch (cloudinaryError) {
        healthStatus.services.cloudinary = {
          status: 'unhealthy',
          responseTime: `${Date.now() - cloudinaryStart}ms`,
          error:
            cloudinaryError instanceof Error
              ? cloudinaryError.message
              : 'Cloudinary not configured',
        } as any;
        healthStatus.status = 'degraded';
      }

      // Test du service mail
      const mailStart = Date.now();
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: envs.SMTP_HOST,
          port: envs.SMTP_PORT,
          secure: false,
          auth: {
            user: envs.SMTP_USER,
            pass: envs.SMTP_PASS,
          },
        });

        await transporter.verify();
        const mailTime = Date.now() - mailStart;
        healthStatus.services.mail = {
          status: 'healthy',
          responseTime: `${mailTime}ms`,
          provider: envs.SMTP_HOST,
        } as any;
      } catch (mailError) {
        healthStatus.services.mail = {
          status: 'unhealthy',
          responseTime: `${Date.now() - mailStart}ms`,
          error: mailError instanceof Error ? mailError.message : 'Mail service not configured',
        } as any;
        healthStatus.status = 'degraded';
      }

      // Test de Redis
      const redisStart = Date.now();
      try {
        const Redis = await import('ioredis');
        const redis = new Redis.default({
          host: envs.REDIS_HOST,
          port: envs.REDIS_PORT,
          password: envs.REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: 3,
        });

        await redis.ping();
        await redis.quit();
        const redisTime = Date.now() - redisStart;
        healthStatus.services.redis = {
          status: 'healthy',
          responseTime: `${redisTime}ms`,
        };
      } catch (redisError) {
        healthStatus.services.redis = {
          status: 'unhealthy',
          responseTime: `${Date.now() - redisStart}ms`,
          error: redisError instanceof Error ? redisError.message : 'Redis not configured',
        } as any;
        healthStatus.status = 'degraded';
      }

      // Déterminer le statut global
      const unhealthyServices = Object.values(healthStatus.services).filter(
        (s) => s.status === 'unhealthy',
      );
      if (unhealthyServices.length > 0) {
        healthStatus.status =
          unhealthyServices.length === Object.keys(healthStatus.services).length
            ? 'unhealthy'
            : 'degraded';
      }

      const statusCode =
        healthStatus.status === 'ok' ? 200 : healthStatus.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(healthStatus);
    } catch (error) {
      response.serverError(_req, res, `Health check failed: ${error}`);
    }
  },
};

export default healthControllers;
