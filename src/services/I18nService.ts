import { en } from '../locales/en';
import { fr } from '../locales/fr';
import type {
  I18nConfig,
  I18nService as II18nService,
  SupportedLanguage,
  TranslationKey,
  TranslationParams,
} from '../types/i18n.types';

export class I18nService implements II18nService {
  private translations: Record<SupportedLanguage, TranslationKey>;
  private currentLanguage: SupportedLanguage;
  private config: I18nConfig;

  constructor() {
    this.translations = { fr, en };
    this.config = {
      defaultLanguage: 'fr',
      supportedLanguages: ['fr', 'en'],
    };
    this.currentLanguage = this.config.defaultLanguage;
  }

  /**
   * Traduit une clé de traduction avec paramètres optionnels
   * @param key - Clé de traduction (ex: 'api.users.created')
   * @param language - Langue cible (optionnel, utilise la langue courante)
   * @param params - Paramètres à remplacer dans la traduction
   * @returns La traduction ou la clé si non trouvée
   */
  translate(key: string, language?: SupportedLanguage, params?: TranslationParams): string {
    const targetLanguage = language || this.currentLanguage;
    const translation = this.getNestedValue(this.translations[targetLanguage], key);

    if (!translation) {
      // Fallback vers la langue par défaut si la traduction n'existe pas
      const fallbackTranslation = this.getNestedValue(
        this.translations[this.config.defaultLanguage],
        key,
      );
      if (fallbackTranslation) {
        return this.interpolate(fallbackTranslation, params);
      }

      // Retourner la clé si aucune traduction trouvée
      console.warn(`Translation not found for key: ${key} in language: ${targetLanguage}`);
      return key;
    }

    return this.interpolate(translation, params);
  }

  /**
   * Détecte la langue depuis le header Accept-Language
   * @param acceptLanguage - Header Accept-Language (ex: 'fr-FR,en;q=0.9')
   * @returns La langue détectée ou la langue par défaut
   */
  detectLanguage(acceptLanguage?: string): SupportedLanguage {
    if (!acceptLanguage) {
      return this.config.defaultLanguage;
    }

    // Parser le header Accept-Language
    const languages = acceptLanguage
      .split(',')
      .map((lang) => {
        const [code, quality] = lang.trim().split(';q=');
        return {
          code: code.toLowerCase().split('-')[0] as SupportedLanguage,
          quality: quality ? parseFloat(quality) : 1.0,
        };
      })
      .sort((a, b) => b.quality - a.quality);

    // Trouver la première langue supportée
    for (const lang of languages) {
      if (this.config.supportedLanguages.includes(lang.code)) {
        return lang.code;
      }
    }

    return this.config.defaultLanguage;
  }

  /**
   * Définit la langue courante
   * @param language - Langue à définir
   */
  setLanguage(language: SupportedLanguage): void {
    if (this.config.supportedLanguages.includes(language)) {
      this.currentLanguage = language;
    } else {
      console.warn(`Unsupported language: ${language}. Using default language.`);
      this.currentLanguage = this.config.defaultLanguage;
    }
  }

  /**
   * Retourne la langue courante
   * @returns La langue courante
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Récupère une valeur imbriquée dans un objet
   * @param obj - Objet source
   * @param path - Chemin de la clé (ex: 'a.b.c')
   * @returns La valeur ou undefined si non trouvée
   */
  private getNestedValue(obj: any, path: string): string | undefined {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Interpole les paramètres dans une chaîne de caractères
   * @param template - Template avec placeholders (ex: 'Hello {name}')
   * @param params - Paramètres à remplacer
   * @returns La chaîne interpolée
   */
  private interpolate(template: string, params?: TranslationParams): string {
    if (!params) {
      return template;
    }

    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }
}
