import type { ScheduledTask } from 'node-cron';
import axios from 'axios';
import { MongoClient } from 'mongodb';

import log from '@/services/logging/logger';
import send_mail from '@/services/Mail/send-mail';
import { envs } from '@/config/env/env';

import { scheduler } from '..';
import { schedulerConfig } from '../_config';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

/**
 * Job to perform health checks on critical services
 */
export class HealthCheckJob {
  private task: ScheduledTask | null = null;
  private readonly healthCheckEmail = 'herman.moukam5@gmail.com';

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
    } catch (job_error) {
      log.error(`********************Error in HealthCheckJob: ${job_error} ********************`);
      await this.sendCriticalErrorEmail(job_error);
    }
  }

  // Perform all health checks
  private async performHealthChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    // Check MongoDB
    results.push(await this.checkMongoDB());

    // Check Redis
    results.push(await this.checkRedis());

    // Check API Server
    results.push(await this.checkAPIServer());

    // Check Cloudinary (if configured)
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      results.push(await this.checkCloudinary());
    }

    // Check SMTP
    results.push(await this.checkSMTP());

    return results;
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
    } catch (error: any) {
      return {
        service: 'MongoDB',
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Check Redis connectivity
  private async checkRedis(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const { createClient } = await import('redis');
      const redisUrl = envs.REDIS_URL || 'redis://localhost:6379';

      const redisClient = createClient({ url: redisUrl });
      await redisClient.connect();
      await redisClient.ping();
      await redisClient.disconnect();

      return {
        service: 'Redis',
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        service: 'Redis',
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Check API Server
  private async checkAPIServer(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const response = await axios.get(`http://localhost:${envs.PORT}/api-docs`, {
        timeout: 5000,
      });

      const isHealthy = response.status === 200;
      return {
        service: 'API Server',
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        service: 'API Server',
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Check Cloudinary
  private async checkCloudinary(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      // Try a simple Cloudinary API call
      const { v2: cloudinary } = await import('cloudinary');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      // Check account info
      const result = await cloudinary.api.resource_by_type('upload', {
        max_results: 1,
      });

      return {
        service: 'Cloudinary',
        status: result ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        service: 'Cloudinary',
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Check SMTP
  private async checkSMTP(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const transporter = await import('@/services/Mail/_config/transporter').then((m) => m.default);

      // Verify connection
      await transporter.verify();

      return {
        service: 'SMTP',
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        service: 'SMTP',
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Send health check email with failures
  private async sendHealthCheckEmail(results: HealthCheckResult[]): Promise<void> {
    try {
      const failedServices = results.filter((r) => r.status === 'unhealthy');
      const healthySummary = results.map((r) => `${r.service}: ${r.status} (${r.responseTime}ms)`).join('\n');

      await send_mail(this.healthCheckEmail, 'Health Check Alert', 'health_check_alert', {
        date: new Date().toLocaleDateString('fr-FR'),
        failedServices,
        healthySummary,
        failureCount: failedServices.length,
        totalServices: results.length,
      });

      log.info('Health check alert email sent', { failedServices: failedServices.length });
    } catch (error: any) {
      log.error('Failed to send health check email', { error: error.message });
    }
  }

  // Send critical error email
  private async sendCriticalErrorEmail(error: any): Promise<void> {
    try {
      await send_mail(this.healthCheckEmail, 'Health Check Job Failed', 'health_check_error', {
        date: new Date().toLocaleDateString('fr-FR'),
        errorMessage: error.message,
        errorStack: error.stack,
        timestamp: new Date().toISOString(),
      });

      log.info('Critical error email sent');
    } catch (emailError: any) {
      log.error('Failed to send critical error email', { error: emailError.message });
    }
  }

  // Start the health check job
  start(): void {
    if (this.task) {
      this.task.stop();
    }

    const { schedule, options } = schedulerConfig.healthCheck;
    this.task = scheduler.schedule(schedule, this.execute.bind(this), options);
    log.info('********************HealthCheckJob started********************');
  }

  // Stop the health check job
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    log.info('********************HealthCheckJob stopped********************');
  }
}
