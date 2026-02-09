import { body, header, param, query } from 'express-validator';

import { validate } from '../../../core/constant/validator.constant';
import { I18nService } from '../../I18nService';

// Instance du service d'internationalisation
const i18n = new I18nService();

export const validate_user = {
  signup: [
    // Email validation
    body('email')
      .trim()
      .notEmpty()
      .withMessage(i18n.translate('validation.required', undefined, { field: 'email' }))
      .isEmail()
      .withMessage(i18n.translate('validation.invalid_email'))
      .escape(),

    // Password validation - niveau moyen
    body('password')
      .trim()
      .notEmpty()
      .withMessage(i18n.translate('validation.password_required'))
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 0, // Pas de symbole requis pour niveau moyen
      })
      .withMessage(i18n.translate('validation.password_too_weak')),

    // Fullname validation (selon schema.prisma)
    body('fullname')
      .trim()
      .notEmpty()
      .withMessage(i18n.translate('validation.fullname_required'))
      .isString()
      .withMessage(i18n.translate('validation.invalid_format', undefined, { field: 'fullname' }))
      .isLength({
        min: validate.MIN_NAME,
        max: validate.MAX_NAME,
      })
      .withMessage(
        i18n.translate('validation.fullname_too_short', undefined, { min: validate.MIN_NAME }),
      )
      .escape(),
  ],

  login: [
    // Email validation
    body('email')
      .trim()
      .notEmpty()
      .withMessage(i18n.translate('validation.required', undefined, { field: 'email' }))
      .isEmail()
      .withMessage(i18n.translate('validation.invalid_email'))
      .escape(),

    // Password validation
    body('password').trim().notEmpty().withMessage(i18n.translate('validation.password_required')),
  ],

  verifyAccount: [
    // Session token validation (header Authorization)
    header('authorization')
      .trim()
      .notEmpty()
      .withMessage(i18n.translate('validation.required', undefined, { field: 'authorization' }))
      .matches(/^Bearer .+$/)
      .withMessage(
        i18n.translate('validation.invalid_format', undefined, { field: 'authorization' }),
      ),

    // Email validation
    body('email')
      .trim()
      .notEmpty()
      .withMessage(i18n.translate('validation.required', undefined, { field: 'email' }))
      .isEmail()
      .withMessage(i18n.translate('validation.invalid_email'))
      .escape(),

    // OTP validation - exactement 6 chiffres
    body('otp')
      .trim()
      .notEmpty()
      .withMessage(i18n.translate('validation.otp_required'))
      .isString()
      .withMessage(i18n.translate('validation.invalid_format', undefined, { field: 'otp' }))
      .isLength({ min: 6, max: 6 })
      .withMessage(i18n.translate('validation.otp_invalid_length'))
      .isNumeric()
      .withMessage(i18n.translate('validation.otp_invalid_format')),
  ],

  forgotPassword: [
    // Email validation
    body('email')
      .trim()
      .notEmpty()
      .withMessage(i18n.translate('validation.required', undefined, { field: 'email' }))
      .isEmail()
      .withMessage(i18n.translate('validation.invalid_email'))
      .escape(),
  ],

  resendOtp: [
    // Session token validation (header Authorization)
    header('authorization')
      .trim()
      .notEmpty()
      .withMessage(i18n.translate('validation.required', undefined, { field: 'authorization' }))
      .matches(/^Bearer .+$/)
      .withMessage(
        i18n.translate('validation.invalid_format', undefined, { field: 'authorization' }),
      ),
  ],

  resetPassword: [
    // Reset token validation
    param('resetToken').notEmpty().withMessage(i18n.translate('validation.reset_token_required')),

    // New password validation - niveau moyen
    body('new_password')
      .trim()
      .notEmpty()
      .withMessage(i18n.translate('validation.new_password_required'))
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 0, // Pas de symbole requis pour niveau moyen
      })
      .withMessage(i18n.translate('validation.password_too_weak')),
  ],

  changePassword: [
    // Current password validation
    body('current_password')
      .trim()
      .notEmpty()
      .withMessage(i18n.translate('validation.current_password_required')),

    // New password validation - niveau moyen
    body('new_password')
      .trim()
      .notEmpty()
      .withMessage(i18n.translate('validation.new_password_required'))
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
      })
      .withMessage(i18n.translate('validation.password_too_weak')),
  ],

  updateUserInfo: [
    // Fullname validation (selon schema.prisma)
    body('fullname')
      .optional()
      .trim()
      .isString()
      .withMessage(i18n.translate('validation.invalid_format', undefined, { field: 'fullname' }))
      .isLength({
        min: validate.MIN_NAME,
        max: validate.MAX_NAME,
      })
      .withMessage(
        i18n.translate('validation.fullname_too_short', undefined, { min: validate.MIN_NAME }),
      )
      .escape(),
  ],

  updateUserRole: [
    // User ID validation
    param('user_id')
      .notEmpty()
      .withMessage(i18n.translate('validation.required', undefined, { field: 'user_id' })),

    // Role validation
    body('role')
      .trim()
      .notEmpty()
      .withMessage(i18n.translate('validation.role_required'))
      .isIn(['USER', 'ADMIN', 'MODERATOR'])
      .withMessage(i18n.translate('validation.role_invalid')),
  ],

  deleteUser: [
    // User ID validation
    param('user_id')
      .notEmpty()
      .withMessage(i18n.translate('validation.required', undefined, { field: 'user_id' })),
  ],

  searchUser: [
    // Search query validation
    query('search')
      .optional()
      .trim()
      .isString()
      .withMessage(i18n.translate('validation.invalid_format', undefined, { field: 'search' }))
      .isLength({ min: 1, max: 100 })
      .withMessage(
        i18n.translate('validation.max_length', undefined, { field: 'search', max: 100 }),
      ),
  ],

  listUsers: [
    // Boolean filters validation
    query('is_active')
      .optional()
      .isBoolean()
      .withMessage(i18n.translate('validation.invalid_format', undefined, { field: 'is_active' })),

    query('is_verified')
      .optional()
      .isBoolean()
      .withMessage(
        i18n.translate('validation.invalid_format', undefined, { field: 'is_verified' }),
      ),

    query('is_deleted')
      .optional()
      .isBoolean()
      .withMessage(i18n.translate('validation.invalid_format', undefined, { field: 'is_deleted' })),

    // Pagination validation
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage(i18n.translate('validation.invalid_format', undefined, { field: 'page' })),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage(
        i18n.translate('validation.max_length', undefined, { field: 'limit', max: 100 }),
      ),
  ],

  get_user_by_id: [
    // User ID validation
    param('user_id')
      .notEmpty()
      .withMessage(i18n.translate('validation.required', undefined, { field: 'user_id' })),
  ],
};
