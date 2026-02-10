import type {
  ITemplateNotificationError,
  ITemplateNotificationSuccess,
  ITemplateOTP,
  ITemplateResetPassword,
} from '../interface/types';
import { renderTemplate } from '../utils/utils';

/**
 * Export des fonctions spécifiques, en utilisant la fonction générique
 */
const templateManager = {
  otp: (data: ITemplateOTP) => renderTemplate('otp.ejs', data, 'OTP'),

  resetPassword: (data: ITemplateResetPassword) =>
    renderTemplate('reset-password.ejs', data, 'Reset Password'),

  welcome: (data: any) => renderTemplate('welcome.ejs', data, 'Welcome'),

  alert_login: (data: ITemplateResetPassword) =>
    renderTemplate('alert-login.ejs', data, 'Alert Login'),

  backup_success_notification: (data: ITemplateNotificationSuccess) =>
    renderTemplate('db-notification-success.ejs', data, 'DB Notification Success'),

  backup_error_notification: (data: ITemplateNotificationError) =>
    renderTemplate('db-notification-error.ejs', data, 'DB Notification Error'),

  health_check_alert: (data: any) =>
    renderTemplate('health-check-alert.ejs', data, 'Health Check Alert'),

  health_check_error: (data: any) =>
    renderTemplate('health-check-error.ejs', data, 'Health Check Error'),
};

export default templateManager;
