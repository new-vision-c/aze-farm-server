/* eslint-disable no-promise-executor-return */
import axios from 'axios';
import { MongoClient } from 'mongodb';
import type { ScheduledTask } from 'node-cron';

import { envs } from '@/config/env/env';
import send_mail from '@/services/Mail/send-mail';
import log from '@/services/logging/logger';

import { scheduler } from '..';
import { schedulerConfig } from '../_config';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

type ServiceCheckFunction = () => Promise<HealthCheckResult>;

/**
 * Job to perform health checks on critical services
 */
export class HealthCheckJob {
  private task: ScheduledTask | null = null;
  private readonly healthCheckEmail = envs.HEALTH_CHECK_EMAIL || 'admin@aze-farm.com';

  // Execute the health check job
  async execute(): Promise<void> {
    try {
      log.info('Starting health check...');
      const results = await this.performHealthChecks();
      const failedChecks = results.filter((r) => r.status === 'unhealthy');

      if (failedChecks.length > 0) {
        log.warn('Health check found issues', { failedChecks });
        await this.sendHealthCheckEmail(results);
      } else {
        log.info('All health checks passed', { results });
      }
    } catch (jobError) {
      const errorMsg = jobError instanceof Error ? jobError.message : String(jobError);
      log.error(`********************Error in HealthCheckJob: ${errorMsg} ********************`);
      await this.sendCriticalErrorEmail(jobError);
    }
  }

  // Perform all health checks in parallel
  private async performHealthChecks(): Promise<HealthCheckResult[]> {
    const checks: ServiceCheckFunction[] = [
      () => this.checkMongoDB(),
      () => this.checkRedis(),
      () => this.checkAPIServer(),
      () => this.checkSMTP(),
    ];

    // Add Cloudinary check if configured
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      checks.push(() => this.checkCloudinary());
    }

    try {
      const results = await Promise.all(checks.map((check) => check()));
      return results;
    } catch (error) {
      log.error('Error during parallel health checks', { error });
      throw error;
    }
  }

  // Check MongoDB connectivity
  private async checkMongoDB(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const client = new MongoClient(envs.DATABASE_URL, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 5000,
      });

      await client.connect();
      await client.db('admin').command({ ping: 1 });
      await client.close();

      return {
        service: 'MongoDB',
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        service: 'MongoDB',
        status: 'unhealthy',
        error: errorMessage,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Check Redis connectivity
  private async checkRedis(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const net = await import('net');
      // En développement, utiliser localhost par défaut si pas configuré
      const redisHost =
        process.env.NODE_ENV === 'development' ? envs.REDIS_HOST || 'localhost' : envs.REDIS_HOST;
      const redisPort = envs.REDIS_PORT || 6379;
      const timeoutMs = 5000;

      return Promise.race([
        new Promise<HealthCheckResult>((resolve) => {
          const socket = net.createConnection(redisPort, redisHost);

          socket.on('connect', () => {
            socket.destroy();
            resolve({
              service: 'Redis',
              status: 'healthy',
              responseTime: Date.now() - startTime,
            });
          });

          socket.on('error', (error: Error) => {
            socket.destroy();
            resolve({
              service: 'Redis',
              status: 'unhealthy',
              error: error.message,
              responseTime: Date.now() - startTime,
            });
          });
        }),
        new Promise<HealthCheckResult>((resolve) =>
          setTimeout(
            () =>
              resolve({
                service: 'Redis',
                status: 'unhealthy',
                error: 'Connection timeout',
                responseTime: Date.now() - startTime,
              }),
            timeoutMs,
          ),
        ),
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        service: 'Redis',
        status: 'unhealthy',
        error: errorMessage,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Check API Server
  private async checkAPIServer(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      // En développement, utiliser l'URL locale, sinon celle configurée
      const apiUrl =
        process.env.NODE_ENV === 'development'
          ? `http://localhost:${envs.PORT}${envs.API_PREFIX}/healthcheck`
          : envs.HEALTH_CHECK_API_URL;
      const response = await axios.get(apiUrl, {
        timeout: 5000,
      });

      const isHealthy = response.status === 200;
      return {
        service: 'API Server',
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        service: 'API Server',
        status: 'unhealthy',
        error: errorMessage,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Check Cloudinary
  private async checkCloudinary(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      // Simple check: verify credentials are configured
      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        return {
          service: 'Cloudinary',
          status: 'unhealthy',
          error: 'Cloudinary credentials not configured',
          responseTime: Date.now() - startTime,
        };
      }

      // Check resource types (basic API check)
      const { v2: cloudinary } = await import('cloudinary');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      // Try to call a simple API endpoint
      const result = await cloudinary.api.resource_types();

      return {
        service: 'Cloudinary',
        status: result ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        service: 'Cloudinary',
        status: 'unhealthy',
        error: errorMessage,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Check SMTP
  private async checkSMTP(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const transporter = await import('@/services/Mail/_config/transporter').then(
        (m) => m.default,
      );

      // Verify connection
      await transporter.verify();

      return {
        service: 'SMTP',
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        service: 'SMTP',
        status: 'unhealthy',
        error: errorMessage,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Send health check email with failures
  private async sendHealthCheckEmail(results: HealthCheckResult[]): Promise<void> {
    try {
      const failedServices = results.filter((r) => r.status === 'unhealthy');
      const healthySummary = results
        .map((r) => `${r.service}: ${r.status} (${r.responseTime}ms)`)
        .join('\n');

      await send_mail(this.healthCheckEmail, 'Health Check Alert', 'health_check_alert', {
        date: new Date().toLocaleDateString('fr-FR'),
        failedServices,
        healthySummary,
        failureCount: failedServices.length,
        totalServices: results.length,
      });

      log.info('Health check alert email sent', { failedServices: failedServices.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Failed to send health check email', { error: errorMessage });
    }
  }

  // Send critical error email
  private async sendCriticalErrorEmail(error: unknown): Promise<void> {
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';

      await send_mail(this.healthCheckEmail, 'Health Check Job Failed', 'health_check_error', {
        date: new Date().toLocaleDateString('fr-FR'),
        errorMessage,
        errorStack,
        timestamp: new Date().toISOString(),
      });

      log.info('Critical error email sent');
    } catch (emailError) {
      const errorMsg = emailError instanceof Error ? emailError.message : String(emailError);
      log.error('Failed to send critical error email', { error: errorMsg });
    }
  }

  // Start the health check job
  start(): void {
    if (this.task) {
      void this.task.stop();
    }

    const { schedule, options } = schedulerConfig.healthCheck;
    this.task = scheduler.schedule(schedule, this.execute.bind(this), options);
    log.info('********************HealthCheckJob started********************');
  }

  // Stop the health check job
  stop(): void {
    if (this.task) {
      void this.task.stop();
      this.task = null;
    }
    log.info('********************HealthCheckJob stopped********************');
  }
}
