// Scheduler configuration types
import { envs } from '@/config/env/env';

import type { SchedulerConfig } from '../_types/user';

// Scheduler configuration
export const schedulerConfig: SchedulerConfig = {
  // User cleanup job configuration
  userCleanup: {
    schedule: '0 */12 * * *', // Toutes les 12 heures
    options: {
      timezone: envs.TIMEZONE || 'Africa/Douala',
    },
    // schedule: '* * * * *', // Every minute (for testing)
  },

  backupJob: {
    schedule: '0 2 * * *', // Every day at 2 AM (disabled in development)
    options: {
      timezone: envs.TIMEZONE || 'Africa/Douala',
      scheduled: process.env.NODE_ENV === 'production', // Only run in production
    },
  },

  healthCheck: {
    schedule: '*/10 * * * *', // Chaque 10 minutes
    options: {
      timezone: envs.TIMEZONE || 'Africa/Douala',
    },
  },
  // Add more scheduled tasks configurations here as needed
};
