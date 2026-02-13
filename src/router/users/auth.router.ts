import { Router } from 'express';

import users_controller from '@/controllers/users/users.controller';
import { isAuthenticated } from '@/middlewares/auth';
import { upload } from '@/middlewares/upload';
import { validationErrorHandler } from '@/middlewares/validationErrorHandler';
import { validate_user } from '@/services/validator/validate/users';

const auth = Router();

// ============================================
// PUBLIC ROUTES - Authentication
// ============================================

// Sign up
auth.post(
  '/register',
  upload.single('profile'),
  validate_user.signup,
  validationErrorHandler,
  users_controller.signup,
);

// Verify account with OTP
auth.post(
  '/verify-otp',
  isAuthenticated,
  validate_user.verifyAccount,
  validationErrorHandler,
  users_controller.verify_otp,
);

// Resend OTP
auth.post(
  '/resend-otp',
  validate_user.resendOtp,
  validationErrorHandler,
  users_controller.resend_otp,
);

// Login
auth.post('/login', validate_user.login, validationErrorHandler, users_controller.login);

// Forgot password - Step 1: Send OTP
auth.post(
  '/forgot-password',
  validate_user.forgotPasswordStep1,
  validationErrorHandler,
  users_controller.forgotPasswordStep1,
);

// Forgot password - Step 2: Verify OTP and generate session token
auth.post(
  '/forgot-password/verify-otp',
  validate_user.forgotPasswordStep2,
  validationErrorHandler,
  users_controller.forgotPasswordStep2,
);

// Forgot password - Step 3: Reset password with session token
auth.post(
  '/forgot-password/reset',
  validate_user.forgotPasswordStep3,
  validationErrorHandler,
  users_controller.forgotPasswordStep3,
);

// Reset password
auth.post(
  '/reset-password/:resetToken',
  validate_user.resetPassword,
  validationErrorHandler,
  users_controller.reset_password,
);

// ============================================
// PROTECTED ROUTES - Require Authentication
// ============================================

// Logout
auth.post(
  '/logout',
  // isAuthenticated,
  users_controller.logout,
);

// Change password
auth.post(
  '/change-password',
  // isAuthenticated,
  validate_user.changePassword,
  validationErrorHandler,
  users_controller.change_password,
);

// Update profile
auth.put(
  '/me/profile',
  upload.single('avatar'), // Gérer l'upload d'un fichier nommé 'avatar'
  // isAuthenticated,
  users_controller.updateProfile,
);

// Get profile
auth.get(
  '/me/profile',
  // isAuthenticated,
  users_controller.getProfile,
);

export default auth;
