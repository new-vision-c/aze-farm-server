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
  },

  // User messages
  users: {
    created: 'User created successfully',
    updated: 'User updated successfully',
    deleted: 'User deleted successfully',
    not_found: 'User not found',
    already_exists: 'User already exists',
    profile_updated: 'Profile updated successfully',
  },

  // Generic CRUD messages
  crud: {
    created: '{resource} created successfully',
    updated: '{resource} updated successfully',
    deleted: '{resource} deleted successfully',
    not_found: '{resource} not found',
    list_empty: 'No {resource} found',
    list_loaded: '{count} {resource}(s) loaded successfully',
  },

  // Validation messages
  validation: {
    required: 'The {field} field is required',
    invalid_email: 'The email is not valid',
    invalid_format: 'The {field} field format is invalid',
    min_length: 'The {field} field must contain at least {min} characters',
    max_length: 'The {field} field must not exceed {max} characters',
    invalid_date: 'The date is not valid',
    future_date: 'The date must be in the future',
    past_date: 'The date must be in the past',
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
