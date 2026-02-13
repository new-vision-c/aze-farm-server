export interface ITemplateOTP {
  name: string;
  otp: string;
  language: string;
  otp_email_subject?: string;
  otp_platform_description?: string;
  otp_welcome_message?: string;
  otp_validity_message?: string;
  otp_thank_you?: string;
}

export interface ITemplateWelcome {
  name: string;
  language: string;
  welcome_email_subject?: string;
  welcome_platform_description?: string;
  welcome_message?: string;
  welcome_next_steps?: string;
  welcome_cta_button?: string;
  welcome_thank_you?: string;
  verification_link?: string;
}

export interface ITemplateResetPassword {
  date: string;
  name: string;
}

export interface ITemplateNotificationSuccess {
  date: string;
  backupPath: string;
  size: string;
  duration: string;
}

export interface ITemplateNotificationError {
  date: string;
  errorMessage: string;
  stackTrace?: string;
}

export type TemplateData = Record<string, any>; // can be extended as needed
