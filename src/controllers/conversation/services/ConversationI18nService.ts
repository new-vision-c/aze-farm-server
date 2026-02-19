import { en, fr } from '../locales';

export type SupportedLanguage = 'fr' | 'en';

export interface ConversationI18nService {
  translate(
    key: string,
    language?: SupportedLanguage,
    params?: Record<string, string | number>,
  ): string;
  detectLanguage(acceptLanguage?: string): SupportedLanguage;
  setLanguage(language: SupportedLanguage): void;
  getCurrentLanguage(): SupportedLanguage;
}

export class ConversationI18nServiceImpl implements ConversationI18nService {
  private translations: Record<SupportedLanguage, Record<string, string>>;
  private currentLanguage: SupportedLanguage;

  constructor() {
    this.translations = { fr, en };
    this.currentLanguage = this.detectLanguage();
  }

  /**
   * Traduit une clé de traduction avec paramètres optionnels
   */
  translate(
    key: string,
    language?: SupportedLanguage,
    params?: Record<string, string | number>,
  ): string {
    const targetLanguage = language || this.currentLanguage;
    const translation = this.getNestedValue(this.translations[targetLanguage], key);

    if (!translation) {
      // Fallback vers la langue par défaut si la traduction n'existe pas
      const fallbackTranslation = this.getNestedValue(this.translations['fr'], key);
      return fallbackTranslation || key;
    }

    // Remplacer les paramètres dans la traduction
    if (params) {
      return this.replaceParams(translation, params);
    }

    return translation;
  }

  /**
   * Détecte la langue préférée depuis les headers Accept-Language
   */
  detectLanguage(acceptLanguage?: string): SupportedLanguage {
    if (!acceptLanguage) {
      // Détection depuis le navigateur ou fallback vers français
      const browserLang = typeof navigator !== 'undefined' ? navigator.language : 'fr-FR';
      return browserLang.startsWith('en') ? 'en' : 'fr';
    }

    const preferredLang = acceptLanguage.split(',')[0].split('-')[0];
    return preferredLang === 'en' ? 'en' : 'fr';
  }

  /**
   * Définit la langue courante
   */
  setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
  }

  /**
   * Récupère la langue courante
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Récupère une valeur imbriquée dans un objet avec notation par points
   */
  private getNestedValue(obj: Record<string, any>, path: string): string {
    const value = path.split('.').reduce((current, key) => current?.[key], obj);
    return typeof value === 'string' ? value : '';
  }

  /**
   * Remplace les paramètres dans une chaîne de traduction
   */
  private replaceParams(str: string, params: Record<string, string | number>): string {
    return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }
}

// Instance singleton pour utilisation dans le module
export const conversationI18n = new ConversationI18nServiceImpl();
