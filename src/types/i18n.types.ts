export type SupportedLanguage = 'fr' | 'en';

export interface TranslationKey {
  [key: string]: string | TranslationKey;
}

export interface I18nConfig {
  defaultLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
}

export interface TranslationParams {
  [key: string]: string | number;
}

export interface I18nService {
  translate(key: string, language?: SupportedLanguage, params?: TranslationParams): string;
  detectLanguage(acceptLanguage?: string): SupportedLanguage;
  setLanguage(language: SupportedLanguage): void;
  getCurrentLanguage(): SupportedLanguage;
}
