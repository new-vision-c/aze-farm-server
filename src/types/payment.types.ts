import type { PaymentStatus } from '@prisma/client';

// Types pour les méthodes de paiement
export enum PaymentMethod {
  MOBILE_MONEY = 'mobile_money',
  ORANGE_MONEY = 'orange_money',
  MTN_MOMO = 'mtn_momo',
  WAVE = 'wave',
  MOOV_MONEY = 'moov_money',
}

// Types pour les opérateurs mobiles
export enum MobileOperator {
  ORANGE = 'orange',
  MTN = 'mtn',
  WAVE = 'wave',
  MOOV = 'moov',
}

// Types pour les devises supportées
export enum Currency {
  XAF = 'XAF',
  EUR = 'EUR',
  USD = 'USD',
}

// Types pour les types de paiement
export enum PaymentType {
  ORDER = 'order',
  WITHDRAWAL = 'withdrawal',
}

// Interface pour les informations de paiement mobile
export interface MobilePaymentInfo {
  operator: MobileOperator;
  phoneNumber: string;
  countryCode: string;
  otp?: string;
}

// Interface pour les informations de paiement
export interface PaymentInfo {
  type: PaymentType;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  mobileInfo?: MobilePaymentInfo;
  userId: string;
  farmId?: string;
  orderId?: string;
  withdrawalRequestId?: string;
  description: string;
}

// Interface pour la réponse de Monebil
export interface MonebilResponse {
  success: boolean;
  transactionId?: string;
  status?: PaymentStatus;
  message?: string;
  errorCode?: string;
  providerResponse?: any;
  redirectUrl?: string;
  otpRequired?: boolean;
}

// Interface pour l'initialisation du paiement
export interface PaymentInitRequest {
  paymentInfo: PaymentInfo;
  returnUrl?: string;
  cancelUrl?: string;
  notifyUrl?: string;
}

// Interface pour la vérification du paiement
export interface PaymentVerifyRequest {
  transactionId: string;
  otp?: string;
}

// Interface pour le statut du paiement
export interface PaymentStatusResponse {
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  providerResponse?: any;
}

// Interface pour les métadonnées du paiement
export interface PaymentMetadata {
  userId: string;
  farmId?: string;
  orderId?: string;
  withdrawalRequestId?: string;
  paymentType: PaymentType;
  originalAmount: number;
  fees?: number;
  totalAmount: number;
}

// Configuration pour l'environnement de paiement
export interface PaymentConfig {
  mode: 'production' | 'demo' | 'test';
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

// Types d'erreurs de paiement
export enum PaymentErrorType {
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_PHONE = 'INVALID_PHONE',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_OTP = 'INVALID_OTP',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
}

// Interface pour les erreurs de paiement
export interface PaymentError {
  type: PaymentErrorType;
  message: string;
  code?: string;
  details?: any;
}

// Interface pour le callback de Monebil
export interface MonebilCallback {
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  timestamp: Date;
  signature: string;
  metadata?: PaymentMetadata;
  providerResponse?: any;
}

// Interface pour les statistiques de paiement
export interface PaymentStats {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  totalRevenue: number;
  averageTransactionAmount: number;
  transactionsByMethod: Record<PaymentMethod, number>;
  transactionsByType: Record<PaymentType, number>;
}
