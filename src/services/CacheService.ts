import Redis from 'ioredis';

// Configuration Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  keyPrefix: 'aze_farm:',
});

// Interfaces pour le cache
interface CacheOptions {
  ttl?: number; // Time to live en secondes
}

interface CachedSuggestions {
  suggestions: string[];
  timestamp: number;
  searchTerm: string;
}

/**
 * Service de gestion du cache Redis pour les performances
 */
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = redis;
  }

  /**
   * Connecter à Redis
   */
  async connect(): Promise<void> {
    try {
      await this.redis.connect();
      console.log('✅ Connecté à Redis');
    } catch (error) {
      console.error('❌ Erreur de connexion Redis:', error);
    }
  }

  /**
   * Déconnecter de Redis
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect();
      console.log('✅ Déconnecté de Redis');
    } catch (error) {
      console.error('❌ Erreur de déconnexion Redis:', error);
    }
  }

  /**
   * Mettre en cache les suggestions de produits
   */
  async cacheSuggestions(
    searchTerm: string,
    suggestions: string[],
    ttl: number = 300,
  ): Promise<void> {
    try {
      const key = `suggestions:${searchTerm.toLowerCase()}`;
      const value: CachedSuggestions = {
        suggestions,
        timestamp: Date.now(),
        searchTerm,
      };

      await this.redis.setex(key, ttl, JSON.stringify(value));
      console.log(`📦 Suggestions mises en cache pour: "${searchTerm}" (${ttl}s)`);
    } catch (error) {
      console.error('❌ Erreur cache suggestions:', error);
    }
  }

  /**
   * Récupérer les suggestions depuis le cache
   */
  async getCachedSuggestions(searchTerm: string): Promise<string[] | null> {
    try {
      const key = `suggestions:${searchTerm.toLowerCase()}`;
      const cached = await this.redis.get(key);

      if (!cached) {
        return null;
      }

      const parsed: CachedSuggestions = JSON.parse(cached);

      // Vérifier si le cache est encore valide (5 minutes max)
      const maxAge = 5 * 60 * 1000; // 5 minutes en ms
      if (Date.now() - parsed.timestamp > maxAge) {
        await this.redis.del(key);
        console.log(`⏰ Cache expiré pour: "${searchTerm}"`);
        return null;
      }

      console.log(`📦 Suggestions récupérées depuis cache: "${searchTerm}"`);
      return parsed.suggestions;
    } catch (error) {
      console.error('❌ Erreur récupération cache suggestions:', error);
      return null;
    }
  }

  /**
   * Mettre en cache les tendances
   */
  async cacheTrends(trends: any[], ttl: number = 600): Promise<void> {
    try {
      const key = 'trends:searches';
      await this.redis.setex(
        key,
        ttl,
        JSON.stringify({
          trends,
          timestamp: Date.now(),
        }),
      );
      console.log(`📊 Tendances mises en cache (${ttl}s)`);
    } catch (error) {
      console.error('❌ Erreur cache tendances:', error);
    }
  }

  /**
   * Récupérer les tendances depuis le cache
   */
  async getCachedTrends(): Promise<any[] | null> {
    try {
      const key = 'trends:searches';
      const cached = await this.redis.get(key);

      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached);

      // Vérifier si le cache est encore valide (10 minutes max)
      const maxAge = 10 * 60 * 1000; // 10 minutes en ms
      if (Date.now() - parsed.timestamp > maxAge) {
        await this.redis.del(key);
        console.log('⏰ Cache tendances expiré');
        return null;
      }

      console.log('📊 Tendances récupérées depuis cache');
      return parsed.trends;
    } catch (error) {
      console.error('❌ Erreur récupération cache tendances:', error);
      return null;
    }
  }

  /**
   * Mettre en cache les résultats de recherche d'un utilisateur
   */
  async cacheUserSearch(
    userId: string,
    searchParams: any,
    results: any[],
    ttl: number = 1800,
  ): Promise<void> {
    try {
      const key = `search:user:${userId}:${JSON.stringify(searchParams)}`;
      await this.redis.setex(
        key,
        ttl,
        JSON.stringify({
          results,
          timestamp: Date.now(),
        }),
      );
      console.log(`🔍 Recherche utilisateur mise en cache: ${userId}`);
    } catch (error) {
      console.error('❌ Erreur cache recherche utilisateur:', error);
    }
  }

  /**
   * Récupérer la recherche d'un utilisateur depuis le cache
   */
  async getCachedUserSearch(userId: string, searchParams: any): Promise<any[] | null> {
    try {
      const key = `search:user:${userId}:${JSON.stringify(searchParams)}`;
      const cached = await this.redis.get(key);

      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached);

      // Vérifier si le cache est encore valide (30 minutes max)
      const maxAge = 30 * 60 * 1000; // 30 minutes en ms
      if (Date.now() - parsed.timestamp > maxAge) {
        await this.redis.del(key);
        return null;
      }

      console.log(`🔍 Recherche utilisateur récupérée depuis cache: ${userId}`);
      return parsed.results;
    } catch (error) {
      console.error('❌ Erreur récupération cache recherche utilisateur:', error);
      return null;
    }
  }

  /**
   * Mettre en cache les favoris d'un utilisateur
   */
  async cacheUserFavorites(userId: string, favorites: string[], ttl: number = 3600): Promise<void> {
    try {
      const key = `favorites:${userId}`;
      await this.redis.setex(
        key,
        ttl,
        JSON.stringify({
          favorites,
          timestamp: Date.now(),
        }),
      );
      console.log(`❤️ Favoris mis en cache: ${userId}`);
    } catch (error) {
      console.error('❌ Erreur cache favoris:', error);
    }
  }

  /**
   * Récupérer les favoris d'un utilisateur depuis le cache
   */
  async getCachedUserFavorites(userId: string): Promise<string[] | null> {
    try {
      const key = `favorites:${userId}`;
      const cached = await this.redis.get(key);

      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached);

      // Vérifier si le cache est encore valide (1 heure max)
      const maxAge = 60 * 60 * 1000; // 1 heure en ms
      if (Date.now() - parsed.timestamp > maxAge) {
        await this.redis.del(key);
        return null;
      }

      console.log(`❤️ Favoris récupérés depuis cache: ${userId}`);
      return parsed.favorites;
    } catch (error) {
      console.error('❌ Erreur récupération cache favoris:', error);
      return null;
    }
  }

  /**
   * Invalider le cache d'un utilisateur
   */
  async invalidateUserCache(userId: string): Promise<void> {
    try {
      const pattern = `*:${userId}:*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`🗑️ Cache utilisateur invalidé: ${userId} (${keys.length} clés)`);
      }
    } catch (error) {
      console.error('❌ Erreur invalidation cache utilisateur:', error);
    }
  }

  /**
   * Statistiques du cache
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    connected: boolean;
  }> {
    try {
      const info = await this.redis.info('memory');
      const keys = await this.redis.dbsize();

      return {
        totalKeys: keys,
        memoryUsage:
          info
            .split('\r\n')
            .find((line) => line.startsWith('used_memory:'))
            ?.split(':')[1]
            ?.trim() || 'unknown',
        connected: this.redis.status === 'ready',
      };
    } catch (error) {
      console.error('❌ Erreur stats cache:', error);
      return {
        totalKeys: 0,
        memoryUsage: 'unknown',
        connected: false,
      };
    }
  }

  /**
   * Nettoyer les clés expirées
   */
  async cleanup(): Promise<void> {
    try {
      // Redis gère automatiquement l'expiration des clés avec TTL
      // Mais on peut forcer un nettoyage si nécessaire
      console.log('🧹 Nettoyage cache terminé');
    } catch (error) {
      console.error('❌ Erreur nettoyage cache:', error);
    }
  }
}

export default CacheService;
