import type { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import { get_expire_date } from '../utils/Otp/OTPExpirationDate';
import generate_otp from '../utils/Otp/generateOtp';
import type { I18nService } from './I18nService';
import send_mail from './Mail/send-mail';

export interface RegisterStep1Data {
  fullname: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  step: number;
  user?: any;
  token?: string;
  message: string;
  requiresOtp?: boolean;
  otpCode?: string;
  registrationCompleted?: boolean;
  nextAction?: string;
}

export class AuthService {
  private prisma: PrismaClient;
  private i18nService: I18nService;

  constructor(prisma: PrismaClient, i18nService: I18nService) {
    this.prisma = prisma;
    this.i18nService = i18nService;
  }

  /**
   * Étape 1: Inscription avec fullname, email et mot de passe
   */
  async registerStep1(
    data: RegisterStep1Data,
    language: 'fr' | 'en' = 'fr',
  ): Promise<AuthResponse> {
    try {
      const { fullname, email, password } = data;

      // Vérifier si l'email existe déjà
      const existingUser = await this.prisma.users.findFirst({
        where: { email, is_deleted: false },
      });

      if (existingUser?.is_verified) {
        return {
          success: false,
          step: 1,
          message: this.i18nService.translate('users.already_exists', language),
        };
      }

      // Si l'utilisateur existe mais n'est pas vérifié, le supprimer pour permettre une nouvelle inscription
      if (existingUser && !existingUser.is_verified) {
        await this.prisma.users.delete({
          where: { user_id: existingUser.user_id },
        });
      }

      // Hasher le mot de passe
      const passwordHash = await bcrypt.hash(password, 10);

      // Générer l'OTP
      const otpCode = generate_otp() || '000000';
      const otpExpireDate = get_expire_date(new Date());

      // Créer l'utilisateur avec le rôle CONSUMER par défaut
      const user = await this.prisma.users.create({
        data: {
          email,
          password: passwordHash,
          fullname,
          role: 'CONSUMER',
          is_active: false, // Non activé jusqu'à vérification OTP
          is_verified: false,
          otp: {
            code: otpCode,
            expire_at: otpExpireDate,
          },
        },
        select: {
          user_id: true,
          email: true,
          fullname: true,
          role: true,
          is_active: true,
          is_verified: true,
          created_at: true,
        },
      });

      // Mettre à jour la date de dernière connexion
      await this.prisma.users.update({
        where: { user_id: user.user_id },
        data: { last_login_at: new Date() },
      });

      // Générer le JWT de session temporaire (24 heures)
      const sessionToken = jwt.sign(
        {
          userId: user.user_id,
          email: user.email,
          step: 'registration',
          type: 'session',
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' },
      );

      // TODO: Envoyer l'email OTP (mode développement: afficher dans la console)
      console.log(`🔑 OTP généré pour ${email}: ${otpCode} (expire à ${otpExpireDate})`);

      // Envoyer l'email OTP
      try {
        await send_mail(email, 'Code de vérification', 'otp', {
          date: new Date().toLocaleDateString('fr-FR'),
          name: fullname,
          content: otpCode,
        });
      } catch (emailError) {
        console.error('Erreur envoi email OTP:', emailError);
      }

      return {
        success: true,
        step: 1,
        user,
        token: sessionToken,
        message: this.i18nService.translate('emails.verification_sent', language),
        requiresOtp: true,
        otpCode, // En développement uniquement
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Signup error:', error);

      // Vérifier si c'est une erreur de connexion MongoDB
      if (errorMessage.includes('Server selection timeout') || errorMessage.includes('I/O error')) {
        return {
          success: false,
          step: 1,
          message:
            'Erreur de connexion à la base de données. Veuillez vérifier votre connexion Internet.',
        };
      }

      return {
        success: false,
        step: 1,
        message: this.i18nService.translate('server.error', language),
      };
    }
  }

  /**
   * Étape 2: Vérifier l'OTP avec token de session
   */
  async verifyOtp(
    sessionToken: string,
    otpCode: string,
    language: 'fr' | 'en' = 'fr',
  ): Promise<AuthResponse> {
    try {
      // Étape 1: Vérifier et décoder le JWT de session
      const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET || 'your-secret-key') as any;

      // Valider que c'est bien un token de session d'inscription
      if (!decoded.userId || decoded.step !== 'registration' || decoded.type !== 'session') {
        return {
          success: false,
          step: 1,
          message: this.i18nService.translate('auth.token_invalid', language),
        };
      }

      // Étape 2: Récupérer l'utilisateur avec userId depuis le token
      const user = await this.prisma.users.findFirst({
        where: { user_id: decoded.userId, is_deleted: false },
      });

      if (!user) {
        return {
          success: false,
          step: 1,
          message: this.i18nService.translate('users.not_found', language),
        };
      }

      // Étape 3: Vérifier le code OTP
      if (!user.otp || user.otp.code !== otpCode) {
        return {
          success: false,
          step: 1,
          message: this.i18nService.translate('validation.otp_invalid_format', language),
        };
      }

      // Vérifier l'expiration de l'OTP
      if (new Date() > user.otp.expire_at) {
        return {
          success: false,
          step: 1,
          message: this.i18nService.translate('validation.otp_required', language),
        };
      }

      // Étape 4: Marquer l'utilisateur comme vérifié et actif
      await this.prisma.users.update({
        where: { user_id: user.user_id },
        data: {
          is_verified: true,
          is_active: true,
          email_verified_at: new Date(),
          otp: undefined, // Supprimer l'OTP après vérification
        },
      });

      // Mettre à jour la date de dernière connexion
      await this.prisma.users.update({
        where: { user_id: user.user_id },
        data: { last_login_at: new Date() },
      });

      // Étape 5: Générer le JWT de login définitif (7 jours)
      const loginToken = jwt.sign(
        {
          userId: user.user_id,
          email: user.email,
          fullname: user.fullname,
          role: user.role,
          step: 'authenticated',
          type: 'login',
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' },
      );

      // Envoyer l'email de bienvenue
      try {
        await send_mail(user.email, 'Bienvenue !', 'welcome', {
          date: new Date().toLocaleDateString('fr-FR'),
          name: user.fullname,
        });
      } catch (emailError) {
        console.error('Erreur envoi email bienvenue:', emailError);
      }

      return {
        success: true,
        step: 2,
        user: {
          user_id: user.user_id,
          email: user.email,
          fullname: user.fullname,
          role: user.role,
          is_verified: true,
          is_active: true,
        },
        token: loginToken,
        message: this.i18nService.translate('auth.login_success', language),
        registrationCompleted: true,
        nextAction: 'redirect_to_dashboard',
      };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return {
          success: false,
          step: 1,
          message: this.i18nService.translate('auth.token_expired', language),
        };
      }

      if (error.name === 'JsonWebTokenError') {
        return {
          success: false,
          step: 1,
          message: this.i18nService.translate('auth.token_invalid', language),
        };
      }

      return {
        success: false,
        step: 1,
        message: this.i18nService.translate('server.error', language),
      };
    }
  }

  /**
   * Renvoyer l'OTP en utilisant le token de session
   */
  async resendOtp(sessionToken: string, language: 'fr' | 'en' = 'fr'): Promise<any> {
    try {
      // Vérifier et décoder le token JWT de session
      const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET || 'your-secret-key') as {
        userId: string;
        step?: string;
        type?: string;
      };

      // Valider que c'est bien un token de session
      if (decoded.step !== 'registration' || decoded.type !== 'session') {
        return {
          success: false,
          message: this.i18nService.translate('auth.token_invalid', language),
        };
      }

      // Récupérer l'utilisateur avec userId depuis le token
      const user = await this.prisma.users.findFirst({
        where: { user_id: decoded.userId, is_deleted: false },
      });

      if (!user) {
        return {
          success: false,
          message: this.i18nService.translate('users.not_found', language),
        };
      }

      // Générer un nouvel OTP
      const newOtpCode = generate_otp() || '000000';
      const otpExpireDate = get_expire_date(new Date());

      // Mettre à jour l'OTP
      await this.prisma.users.update({
        where: { user_id: user.user_id },
        data: {
          otp: {
            code: newOtpCode,
            expire_at: otpExpireDate,
          },
        },
      });

      // TODO: Envoyer l'email OTP (mode développement: afficher dans la console)
      console.log(`🔑 OTP renvoyé pour ${user.email}: ${newOtpCode} (expire à ${otpExpireDate})`);

      // Envoyer l'email OTP
      try {
        await send_mail(user.email, 'Code de vérification', 'otp', {
          date: new Date().toLocaleDateString('fr-FR'),
          name: user.fullname,
          content: newOtpCode,
        });
      } catch (emailError) {
        console.error('Erreur envoi email OTP:', emailError);
      }

      return {
        success: true,
        message: this.i18nService.translate('emails.verification_sent', language),
        otpCode: newOtpCode, // En développement uniquement
      };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return {
          success: false,
          message: this.i18nService.translate('auth.token_expired', language),
        };
      }

      return {
        success: false,
        message: this.i18nService.translate('server.error', language),
      };
    }
  }

  /**
   * Login utilisateur
   */
  async login(email: string, password: string, language: 'fr' | 'en' = 'fr'): Promise<any> {
    try {
      // Récupérer l'utilisateur
      const user = await this.prisma.users.findFirst({
        where: { email, is_deleted: false },
      });

      if (!user) {
        return {
          success: false,
          message: this.i18nService.translate('auth.credentials_invalid', language),
        };
      }

      // Vérifier le mot de passe
      if (!user.password) {
        return {
          success: false,
          message: this.i18nService.translate('auth.credentials_invalid', language),
        };
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return {
          success: false,
          message: this.i18nService.translate('auth.credentials_invalid', language),
        };
      }

      // Vérifier si le compte est vérifié et actif
      if (!user.is_verified) {
        return {
          success: false,
          message: this.i18nService.translate('auth.access_denied', language),
        };
      }

      if (!user.is_active) {
        return {
          success: false,
          message: this.i18nService.translate('auth.account_disabled', language),
        };
      }

      // Mettre à jour la date de dernière connexion
      await this.prisma.users.update({
        where: { user_id: user.user_id },
        data: { last_login_at: new Date() },
      });

      // Générer le JWT
      const token = jwt.sign(
        {
          userId: user.user_id,
          email: user.email,
          fullname: user.fullname,
          role: user.role,
          step: 'authenticated',
          type: 'login',
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' },
      );

      return {
        success: true,
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          fullname: user.fullname,
          avatar_url: user.avatar_url,
          role: user.role,
          is_verified: user.is_verified,
          is_active: user.is_active,
        },
        message: this.i18nService.translate('auth.login_success', language),
      };
    } catch (_error) {
      return {
        success: false,
        message: this.i18nService.translate('server.error', language),
        error: _error,
      };
    }
  }
}
