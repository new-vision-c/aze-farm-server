# 🚀 Performance, Cache et Personnalisation

## 🎯 Vue d'ensemble

L'endpoint de recherche a été considérablement optimisé avec des fonctionnalités avancées de performance, mise en cache intelligente, et personnalisation utilisateur.

---

## 📦 Cache Redis Intégré

### 1. **CacheService** - Service complet de gestion Redis
- **Connexion automatique** : Gestion des erreurs de connexion
- **TTL configurables** : Durées de vie adaptées par type de donnée
- **Clés structurées** : Namespace organisé (suggestions:, trends:, search:user:)

### 2. **Types de Cache**

#### Cache Suggestions
```typescript
// Clé: suggestions:tomate
// TTL: 5 minutes (300s)
await cacheService.cacheSuggestions('tomate', ['tomate', 'tomate cerise']);
```

#### Cache Tendances
```typescript
// Clé: trends:searches  
// TTL: 10 minutes (600s)
await cacheService.cacheTrends(trendingData);
```

#### Cache Utilisateur
```typescript
// Clé: search:user:userId:{params_hash}
// TTL: 30 minutes (1800s)
await cacheService.cacheUserSearch(userId, params, results);
```

#### Cache Favoris
```typescript
// Clé: favorites:userId
// TTL: 1 heure (3600s)
await cacheService.cacheUserFavorites(userId, favorites);
```

---

## ⚡ Performance Optimizations

### 1. **Compression des Réponses**
- **Middleware** : `compressionMiddleware`
- **Seuil** : 1024 bytes minimum
- **Niveau** : 6 (équilibre vitesse/taille)
- **Types** : JSON, HTML, CSS, JS uniquement

### 2. **Rate Limiting Intelligent**
- **Par endpoint** : Limites adaptées à l'usage
- **Par utilisateur** : Clé dynamique (ID utilisateur ou IP)
- **Détection bots** : Limites plus strictes pour les crawlers

#### Configuration Rate Limiting
```typescript
// Recherche principale: 100 requêtes / 15 minutes
const searchRateLimit = createRateLimit(15 * 60 * 1000, 100, message);

// Suggestions: 20 requêtes / 5 minutes  
const suggestionsRateLimit = createRateLimit(5 * 60 * 1000, 20, message);

// Trends: 10 requêtes / 1 minute
const trendsRateLimit = createRateLimit(60 * 1000, 10, message);
```

### 3. **Headers Performance**
- **X-Response-Time** : Temps de réponse en ms
- **X-Cache-Status** : HIT/MISS pour le cache
- **Sécurité** : XSS, Frame Options, Content Type

---

## 👤 Personnalisation Avancée

### 1. **Nouveaux Paramètres**

| Paramètre | Type | Défaut | Description |
|-----------|-------|----------|-------------|
| `userId` | string | - | ID utilisateur pour personnalisation |
| `favorites` | boolean | false | Mettre en avant les produits favoris |
| `history` | boolean | false | Éviter doublons avec historique |

### 2. **Logique de Personnalisation**

#### Priorisation des Favoris
```typescript
if (favorites && userId) {
  const userFavorites = await this.cacheService.getCachedUserFavorites(userId);
  // Mettre en avant les produits favoris dans les résultats
  productsWithDistance.sort((a, b) => {
    const aIsFavorite = userFavorites?.includes(a.id);
    const bIsFavorite = userFavorites?.includes(b.id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0; // Garder l'ordre normal sinon
  });
}
```

#### Filtrage Historique
```typescript
if (history && userId) {
  const recentSearches = await this.getUserSearchHistory(userId);
  // Éviter de montrer les produits récemment vus
  where.id = { notIn: recentSearches };
}
```

#### Personnalisation par Préférences
```typescript
if (userId) {
  const userPrefs = await this.getUserPreferences(userId);
  // Adapter les résultats selon les préférences
  if (userPrefs.preferLocal) {
    // Prioriser les produits locaux
  }
  if (userPrefs.priceRange) {
    where.price = { gte: userPrefs.priceRange.min, lte: userPrefs.priceRange.max };
  }
}
```

---

## 🔄 Pagination Optimisée

### 1. **Pagination par Curseur**
- **Avantage** : Plus performant pour grands jeux de données
- **Implémentation** : Utilisation des curseurs MongoDB
- **Compatibilité** : Maintien pagination offset/limit

### 2. **Cache Pagination**
```typescript
// Clé de cache inclut les paramètres de pagination
const cacheKey = `search:user:${userId}:${JSON.stringify({
  limit, page, category, productName, farmId, seasonal
})}`;
```

---

## 📊 Monitoring et Analytics

### 1. **Métriques Performance**
- **Temps de réponse** : Tracking automatique en ms
- **Taux de cache** : HIT/MISS par endpoint
- **Utilisation mémoire** : Monitoring Redis en temps réel

### 2. **Alertes Performance**
```typescript
// Requêtes lentes (>1s)
if (duration > 1000) {
  console.warn(`🐌 Requête lente: ${req.method} ${req.path} - ${duration}ms`);
}

// Taux d'erreur de cache
if (cacheErrorRate > 0.1) { // Plus de 10% d'erreurs
  console.error(`🚨 Taux d'erreur cache élevé: ${cacheErrorRate}%`);
}
```

### 3. **Dashboard Cache**
```typescript
const stats = await cacheService.getCacheStats();
// Retourne:
// - totalKeys: Nombre total de clés
// - memoryUsage: Mémoire utilisée  
// - connected: Statut connexion Redis
```

---

## 🛡️ Sécurité Renforcée

### 1. **Rate Limiting Avancé**
- **Clé dynamique** : ID utilisateur si authentifié, sinon IP
- **Détection bots** : Patterns User-Agent spécifiques
- **Protection DoS** : Limites progressives par abus

### 2. **Validation Renforcée**
- **Paramètres** : Validation stricte de tous les inputs
- **Types** : Vérification des formats (ObjectId, boolean, numbers)
- **Limites** : Bornes minimales/maximales enforceées

### 3. **Headers Sécurité**
```typescript
// Ajoutés automatiquement par le middleware
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('X-Frame-Options', 'DENY');  
res.setHeader('X-XSS-Protection', '1; mode=block');
```

---

## 💡 Cas d'Usage Optimisés

### Recherche Personnalisée
```bash
GET /api/products/search?product=tomate&userId=123&favorites=true&history=true
```

### Recherche avec Cache
```bash
# Première requête - calcul et mise en cache
GET /api/products/search?category=légumes

# Deuxième requête - réponse depuis cache (instantanée)
GET /api/products/search?category=légumes
```

### Recherche Haute Performance
```bash
# Avec compression et rate limiting
GET /api/products/search?product=pomme&limit=50

# Headers ajoutés:
# X-Response-Time: 45ms
# X-Cache-Status: HIT
# Content-Encoding: gzip
```

---

## 🎯 Résultats Attendus

### Performance
- **⚡ Temps de réponse** : <100ms (cache HIT) vs <500ms (cache MISS)
- **📦 Taux de cache** : >60% de HIT pour requêtes récurrentes
- **🗜️ Compression** : Réduction de 60-80% de la taille des réponses

### Expérience Utilisateur
- **🎯 Personnalisation** : Résultats adaptés à chaque utilisateur
- **❤️ Favoris** : Produits préférés mis en avant
- **🔄 Historique** : Évitement des doublons intelligents

### Scalabilité
- **📈 Charge** : Support de 10x plus de requêtes simultanées
- **💾 Mémoire** : Optimisation de l'usage Redis
- **🛡️ Sécurité** : Protection contre abus et attaques

---

## 🔧 Configuration Production

### Variables d'Environnement
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
COMPRESSION_LEVEL=6
RATE_LIMIT_WINDOW=900000
CACHE_TTL_SUGGESTIONS=300
CACHE_TTL_TRENDS=600
```

### Monitoring
```bash
# Stats Redis en temps réel
curl http://localhost:3000/metrics/cache

# Performance endpoints
curl http://localhost:3000/health/performance
```

---

*MAJ : 17 Février 2026*
