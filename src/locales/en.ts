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
    already_verified: 'Your account is already verified. You can log in directly.',
    already_verified_use_login:
      'Your account is already verified. Please use the normal login page.',
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
    bearer_token_required: 'Bearer token required',
    otp_required: 'OTP code required',
    otp_verified_success: 'OTP code verified successfully',
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
    subscription_registered: 'Notification subscription registered',
    subscription_removed: 'Notification subscription removed',
    notification_sent: 'Notification sent',
    notification_deleted: 'Notification deleted',
    marked_as_read: 'Notification marked as read',
    all_marked_as_read: 'All notifications marked as read',
    subscription_not_found: 'Subscription not found',
    onesignal_not_configured: 'OneSignal service not configured',
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

  // Payment messages
  payments: {
    initialized: 'Payment initialized successfully',
    init_error: 'Error during payment initialization',
    verified: 'Payment verified successfully',
    verify_error: 'Error during payment verification',
    cancelled: 'Payment cancelled successfully',
    cancel_error: 'Error during payment cancellation',
    status_retrieved: 'Payment status retrieved successfully',
    status_error: 'Error retrieving payment status',
    callback_processed: 'Callback processed successfully',
    callback_error: 'Error processing callback',
    transaction_not_found: 'Transaction not found',
    invalid_amount: 'Amount must be greater than 0',
    invalid_phone: 'Mobile payment information is required',
    insufficient_funds: 'Insufficient funds',
    network_error: 'Network error',
    api_error: 'API error',
    timeout: 'Request timeout',
    invalid_otp: 'Invalid OTP code',
    transaction_failed: 'Transaction failed',
    demo_mode: 'Demo mode - Payment auto-validated',
    phone_invalid_for_provider: 'Invalid phone number for this provider',
    payment_init_error: 'Error during payment initiation',
  },

  // Order messages
  orders: {
    created: 'Orders created and payments initiated successfully',
    retrieved: 'Orders retrieved successfully',
    retrieved_single: 'Order retrieved successfully',
    not_found: 'Order not found',
    cancelled: 'Order cancelled successfully',
    cannot_cancel: 'This order can no longer be cancelled',
    already_paid: 'Order already paid - contact support for cancellation',
    farm_orders_retrieved: 'Farm orders retrieved successfully',
    status_updated: 'Order status updated successfully',
    tracking_retrieved: 'Tracking retrieved successfully',
    confirmation_generated: 'Confirmation token generated successfully',
    delivery_confirmed: 'Delivery confirmed successfully',
    already_delivered: 'Order already delivered',
    invalid_token: 'Invalid token or QR code',
    cart_empty: 'Cart is empty',
    stock_insufficient: 'Insufficient stock for {product} (available: {stock})',
    farmers_only: 'Access restricted to farmers',
    not_ready_for_delivery: 'Order not found or not ready for delivery',
  },

  // Cart messages
  cart: {
    retrieved: 'Cart retrieved successfully',
    item_added: 'Item added to cart successfully',
    item_updated: 'Item updated successfully',
    item_removed: 'Item removed from cart successfully',
    cleared: 'Cart cleared successfully',
    not_found: 'Cart not found',
    item_not_found: 'Item not found in cart',
    product_not_found: 'Product not found',
    product_unavailable: 'Product unavailable or insufficient stock',
    stock_insufficient: 'Insufficient stock for this quantity',
    invalid_quantity: 'Invalid quantity',
    product_quantity_required: 'Valid product and quantity required',
  },

  // Farm messages
  farms: {
    retrieved: 'Farm retrieved successfully',
    not_found: 'Farm not found',
    id_required: 'Farm ID required',
    retrieval_error: 'Error retrieving farm',
  },

  // Rating messages
  ratings: {
    saved: 'Rating saved successfully',
    deleted: 'Rating deleted successfully',
    retrieved: 'Ratings retrieved successfully',
    user_rating_retrieved: 'User rating retrieved successfully',
    stats_retrieved: 'Statistics retrieved successfully',
    check_completed: 'Check completed successfully',
    auth_required: 'Authentication required',
    farm_id_required: 'Farm ID required',
    score_range: 'Rating must be between 1 and 5',
    page_positive: 'Page must be greater than 0',
    limit_range: 'Limit must be between 1 and 50',
    save_error: 'Error saving rating',
    delete_error: 'Error deleting rating',
    retrieve_error: 'Error retrieving ratings',
    user_rating_error: 'Error retrieving user rating',
    stats_error: 'Error retrieving statistics',
    check_error: 'Error during verification',
  },
};
