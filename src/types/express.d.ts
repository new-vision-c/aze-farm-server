import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    user_id: string;
    email: string;
    role: string;
    is_verified: boolean;
    is_active: boolean;
    iat: number;
    exp: number;
  };
}

export interface AuthenticatedRequestWithFile extends AuthenticatedRequest {
  file: Express.Multer.File;
}
