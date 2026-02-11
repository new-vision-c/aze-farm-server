import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

import log from '@/services/logging/logger';

export function validationErrorHandler(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    log.error('Validation errors', errorArray);

    const i18n = (req as any).i18n;
    const language = (req as any).language || 'fr';

    const formattedErrors = errorArray.map((error: any) => {
      let messageKey = '';
      const params: Record<string, any> = { field: error.path };

      // Map express-validator errors to i18n keys
      if (error.msg.includes('required') || error.msg.includes('requis')) {
        messageKey = 'validation.required';
      } else if (error.msg.includes('email') || error.msg.includes('Email')) {
        messageKey = 'validation.invalid_email';
      } else if (
        error.msg.includes('at least') ||
        error.msg.includes('au moins') ||
        error.msg.includes('caractères')
      ) {
        messageKey = 'validation.min_length';
        // Extract minimum length if possible
        const match = error.msg.match(/\d+/);
        if (match) params.min = match[0];
      } else if (error.msg.includes('not more than') || error.msg.includes('pas dépasser')) {
        messageKey = 'validation.max_length';
        const match = error.msg.match(/\d+/);
        if (match) params.max = match[0];
      } else {
        // Use custom message if it matches a validation key
        messageKey = error.msg;
      }

      const translatedMessage = i18n ? i18n.translate(messageKey, language, params) : error.msg;

      return {
        field: error.path,
        message: translatedMessage,
      };
    });

    const startTime = (req as any).startTime;
    const endTime = Date.now();
    const responseTime = startTime ? `${endTime - startTime}ms` : '0ms';

    const meta = {
      path: req.originalUrl,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      responseTime,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    const payload = {
      success: false,
      data: formattedErrors,
      statusCode: 400,
      message: i18n ? i18n.translate('validation.required', language) : 'Validation failed',
      meta,
    };

    log.warn('Response sent', payload);
    return res.status(400).json(payload);
  }
  next();
}
