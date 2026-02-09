import { I18nMiddleware } from '../middlewares/i18n.middleware';
import { I18nService } from '../services/I18nService';

/**
 * Conteneur de services simple pour l'injection de dépendances
 */
class ServiceContainer {
  private services: Map<string, any> = new Map();

  /**
   * Enregistre un service
   */
  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  /**
   * Récupère un service
   */
  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found`);
    }
    return service as T;
  }

  /**
   * Vérifie si un service existe
   */
  has(key: string): boolean {
    return this.services.has(key);
  }
}

// Instance unique du conteneur
export const container = new ServiceContainer();

// Clés des services
export const SERVICE_KEYS = {
  I18N_SERVICE: 'i18n_service',
  I18N_MIDDLEWARE: 'i18n_middleware',
} as const;

// Initialisation des services
export function initializeServices(): void {
  // Enregistrer le service i18n
  const i18nService = new I18nService();
  container.register(SERVICE_KEYS.I18N_SERVICE, i18nService);

  // Enregistrer le middleware i18n
  const i18nMiddleware = new I18nMiddleware(i18nService);
  container.register(SERVICE_KEYS.I18N_MIDDLEWARE, i18nMiddleware);
}
