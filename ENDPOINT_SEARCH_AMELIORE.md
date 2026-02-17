# 📈 Endpoint de Recherche Amélioré

## 🎯 Vue d'ensemble

L'endpoint `/api/products/search` a été considérablement amélioré avec des fonctionnalités avancées de recherche, d'analytics et de filtrage.

---

## 🚀 Nouvelles Fonctionnalités

### 1. **Mode Suggestions Intégré**
- **Paramètre** : `suggestions=true`
- **Usage** : `GET /api/products/search?suggestions=true&product=tomate&limit=5`
- **Fonctionnement** : Retourne des suggestions basées sur les tendances + recherche classique

### 2. **Analytics de Recherche**
- **Tracking automatique** : Toutes les recherches sont enregistrées
- **Métriques** : Temps de réponse, nombre de résultats, filtres utilisés
- **Confidentialité** : IP hashée, données anonymisées

### 3. **Nouveaux Filtres**
- **`farmId`** : Filtrer par ferme spécifique
- **`seasonal=true`** : Uniquement les produits de saison actuelle

### 4. **Tri Amélioré**
- **Par défaut** : Note de ferme → Date de création (plus récents d'abord)
- **Avec localisation** : Distance → Note → Date

---

## 📊 Nouveaux Endpoints

### `/api/products/trends`
```bash
GET /api/products/trends?limit=10&days=30&stats=true
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "trending": [
      { "term": "tomate", "count": 45, "growth": 23.5 },
      { "term": "pomme", "count": 38, "growth": 15.2 }
    ],
    "stats": {
      "totalSearches": 1250,
      "uniqueTerms": 89,
      "avgResponseTime": 120,
      "topCategories": [...]
    }
  }
}
```

---

## 🔧 Paramètres Complets

### Paramètres de Recherche
| Paramètre | Type | Défaut | Description |
|-----------|-------|----------|-------------|
| `suggestions` | boolean | false | Mode suggestions |
| `product` | string | - | Terme de recherche |
| `category` | string | - | Filtrer par catégorie |
| `farmId` | string | - | Filtrer par ferme |
| `seasonal` | boolean | false | Produits de saison |
| `lat/lng` | number | - | Localisation |
| `limit` | integer | 10 | Nombre de résultats |
| `page` | integer | 1 | Pagination |

---

## 📈 Analytics

### Données Collectées
- **Terme de recherche** : Normalisé et stocké
- **Type de recherche** : product/category/suggestions
- **Performance** : Temps de réponse en ms
- **Filtres utilisés** : Tous les filtres appliqués
- **Localisation** : Coordonnées si fournies
- **Métadonnées** : User agent, IP hashée

### Métriques Disponibles
- **Tendances** : Croissance sur 7 jours
- **Popularité** : Termes les plus recherchés
- **Performance** : Temps de réponse moyen
- **Saisonnalité** : Pics saisonniers

---

## 🔄 Endpoint Obsolète

### `/api/products/suggestions` ⚠️
- **Statut** : Obsolète
- **Alternative** : `/api/products/search?suggestions=true&product=votre_terme`
- **Raison** : Unification des fonctionnalités

---

## 💡 Cas d'Usage

### Recherche Simple
```bash
GET /api/products/search?product=tomate
```

### Recherche Avancée
```bash
GET /api/products/search?product=pomme&farmId=xxx&seasonal=true&lat=48.8&lng=2.3
```

### Suggestions Intelligentes
```bash
GET /api/products/search?suggestions=true&product=cerise
```

### Analytics
```bash
GET /api/products/trends?limit=5&stats=true
```

---

## 🎯 Avantages

1. **Performance** : Tracking pour optimisation continue
2. **Pertinence** : Suggestions basées sur les tendances
3. **Flexibilité** : Filtres multiples et combinables
4. **Saisonnalité** : Mise en avant des produits frais
5. **Analytics** : Données précieuses pour les fermiers
6. **Simplification** : Un endpoint principal polyvalent

---

## 📝 Notes Techniques

- **Base de données** : MongoDB avec index optimisés
- **Cache** : Suggestions tendances en cache
- **Sécurité** : IP hashée, données anonymisées
- **Performance** : Tracking asynchrone non bloquant
- **Documentation** : Swagger complète et à jour

---

*MAJ : 17 Février 2026*
