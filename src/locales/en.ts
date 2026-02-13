export const en = {
  // General messages
  server: {
    started: 'Server started successfully',
    error: 'Internal server error',
    not_found: 'Resource not found',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    bad_request: 'Bad request',
  },

  // Authentication messages
  auth: {
    login_success: 'Login successful',
    login_failed: 'Login failed',
    logout_success: 'Logout successful',
    token_required: 'Token required',
    token_invalid: 'Invalid token',
    token_expired: 'Token expired',
    access_denied: 'Access denied',
    verification_success: 'Account verified successfully',
    user_already_verified: 'User already verified',
    otp_invalid: 'Invalid OTP code',
    otp_expired: 'OTP has expired',
    user_not_authenticated: 'User not authenticated',
    credentials_invalid: 'Invalid credentials',
    account_disabled: 'Account disabled',
    password_reset_sent_if_exists: 'If email exists, a reset code has been sent',
    otp_sent_for_password_reset: 'OTP sent for password reset',
    email_otp_sent: 'An OTP code has been sent to your email address',
    otp_email_subject: 'Password reset code',
    otp_email_subject_otp: 'Verification code',
    invalid_or_expired_otp: 'Invalid or expired OTP',
    session_token_generated: 'Session token generated successfully',
    invalid_session_token: 'Invalid session token',
    password_reset_success: 'Password reset successfully',
    otp_welcome_message:
      'We are delighted to welcome you to the great AzeFarm family! To finalize your account verification, please use the code below.',
    otp_validity_message:
      'This code is valid for 10 minutes. If you did not initiate this request, simply ignore this message.',
    otp_thank_you:
      "Thank you for trusting AzeFarm. Together, let's shape the future with technology and passion.",
    otp_platform_description: 'An agricultural products sales platform',
    welcome_email_subject: 'Welcome to AzeFarm',
    welcome_platform_description: 'An agricultural products sales platform',
    welcome_message:
      'We are delighted to welcome you to the great AzeFarm family! Your account has been created successfully.',
    welcome_next_steps:
      'To start using our platform, please verify your email address using the code that was sent to you.',
    welcome_cta_button: 'Verify my account',
    welcome_thank_you: "Thank you for trusting AzeFarm. Together, let's grow the future!",
  },

  // User messages
  users: {
    created: 'User created successfully',
    updated: 'User updated successfully',
    deleted: 'User deleted successfully',
    not_found: 'User not found',
    already_exists: 'User already exists',
    profile_updated: 'Profile updated successfully',
    profile_retrieved: 'Profile retrieved successfully',
  },

  // Validation messages
  validation: {
    required: 'The {field} field is required',
    invalid_email: 'The email is not valid',
    invalid_format: 'The {field} field format is invalid',
    min_length: 'The {field} field must contain at least {min} characters',
    max_length: 'The {field} field must not exceed {max} characters',
    invalid_date: 'The date is not valid',
    email_required: 'Email is required',
    email_and_otp_required: 'Email and OTP code are required',
    all_fields_required: 'All fields are required',
    passwords_not_match: 'Passwords do not match',
    password_too_short: 'Password must contain at least 8 characters',

    // Password validation
    password_required: 'Password is required',
    password_too_weak:
      'Password must be at least 8 characters long with uppercase, lowercase and number',
    password_min_length: 'Password must be at least {min} characters',
    password_uppercase: 'Password must contain at least one uppercase letter',
    password_lowercase: 'Password must contain at least one lowercase letter',
    password_number: 'Password must contain at least one number',

    // OTP validation
    otp_required: 'OTP code is required',
    otp_invalid_length: 'OTP code must contain exactly 6 digits',
    otp_invalid_format: 'OTP code must be composed of digits only',

    // Fullname validation
    fullname_required: 'Full name is required',
    fullname_too_short: 'Full name must contain at least {min} characters',
    fullname_too_long: 'Full name must not exceed {max} characters',

    // Phone validation
    phone_required: 'Phone number is required',
    phone_invalid_format: 'Phone number must be a string',
    phone_too_short: 'Phone number is too short (minimum {min} characters)',
    phone_too_long: 'Phone number is too long (maximum {max} characters)',

    // Role validation
    role_required: 'Role is required',
    role_invalid: 'Role must be USER, ADMIN or MODERATOR',

    // Token validation
    reset_token_required: 'Reset token is required',
    current_password_required: 'Current password is required',
    new_password_required: 'New password is required',
  },

  // File messages
  files: {
    upload_success: 'File uploaded successfully',
    upload_error: 'Error uploading file',
    file_too_large: 'File size must not exceed {maxSize}',
    invalid_type: 'File type not allowed',
    not_found: 'File not found',
    deleted: 'File deleted successfully',
  },

  // Email messages
  emails: {
    sent: 'Email sent successfully',
    send_error: 'Error sending email',
    template_not_found: 'Email template not found',
    verification_sent: 'Verification email sent',
    password_reset_sent: 'Password reset email sent',
  },

  // Notification messages
  notifications: {
    sent: 'Notification sent successfully',
    send_error: 'Error sending notification',
    push_enabled: 'Push notifications enabled',
    push_disabled: 'Push notifications disabled',
  },

  // Cache messages
  cache: {
    cleared: 'Cache cleared successfully',
    error: 'Error clearing cache',
    hit: 'Data retrieved from cache',
    miss: 'Data not found in cache',
  },

  // Monitoring messages
  monitoring: {
    health_check: 'Health check completed',
    service_up: 'Service {service} is up',
    service_down: 'Service {service} is down',
    metrics_collected: 'Metrics collected successfully',
  },

  // Scheduler messages
  scheduler: {
    task_started: 'Task {task} started',
    task_completed: 'Task {task} completed successfully',
    task_failed: 'Task {task} failed',
    task_scheduled: 'Task {task} scheduled',
  },

  // Error messages
  errors: {
    database_connection: 'Database connection error',
    external_service: 'External service {service} error',
    timeout: 'Timeout exceeded',
    rate_limit: 'Rate limit exceeded',
    maintenance: 'Service under maintenance',
    quota_exceeded: 'Quota exceeded',
    server_error: 'Internal server error',
  },

  // Success messages
  success: {
    operation_completed: 'Operation completed successfully',
    data_saved: 'Data saved successfully',
    process_completed: 'Process completed successfully',
    sync_completed: 'Sync completed successfully',
  },

  // API messages
  api: {
    endpoint_not_found: 'Endpoint not found',
    method_not_allowed: 'Method not allowed',
    version_not_supported: 'API version not supported',
    deprecated: 'This endpoint is deprecated',
  },

  // Security messages
  security: {
    csrf_token_invalid: 'Invalid CSRF token',
    rate_limit_exceeded: 'Rate limit exceeded',
    suspicious_activity: 'Suspicious activity detected',
    blocked_ip: 'IP blocked',
    brute_force_detected: 'Brute force attempt detected',
  },

  // Log messages
  logs: {
    created: 'Log created successfully',
    exported: 'Logs exported successfully',
    cleaned: 'Logs cleaned successfully',
    archived: 'Logs archived successfully',
  },
};
