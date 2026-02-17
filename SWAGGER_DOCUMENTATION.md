# 📖 Documentation Swagger Complète

## 🎯 Résumé des Endpoints

### 1. **`GET /api/products/search`** - Recherche principale
- **Description** : Recherche avancée avec filtres, localisation et analytics
- **Fonctionnalités** : Recherche normale + mode suggestions intégré

### 2. **`GET /api/products/trends`** - Analytics des tendances
- **Description** : Statistiques de recherche et tendances populaires
- **Fonctionnalités** : Tendances, croissance, statistiques détaillées

### 3. **`GET /api/products/suggestions`** - ⚠️ Obsolète
- **Description** : Suggestions de produits (obsolète)
- **Alternative** : Utiliser `/api/products/search?suggestions=true`

---

## 🔍 Endpoint Principal : `/api/products/search`

### Paramètres Complets

| Paramètre | Type | Défaut | Validation | Description |
|-----------|-------|----------|-------------|-------------|
| `suggestions` | boolean | false | - | Mode suggestions (retourne tableau de strings) |
| `product` | string | - | Requis si suggestions=true | Terme de recherche partiel |
| `category` | string | - | - | Filtrer par catégorie de produit |
| `farmId` | string | - | Format MongoDB ID | Filtrer par ferme spécifique |
| `seasonal` | boolean | false | - | Uniquement produits de saison actuelle |
| `lat` | number | - | -90 à 90 | Latitude pour calcul distance |
| `lng` | number | - | -180 à 180 | Longitude pour calcul distance |
| `limit` | integer | 10 | 1-100 | Nombre max de résultats |
| `page` | integer | 1 | min 1 | Numéro de page (ignoré en mode suggestions) |

### Réponses

#### Mode Recherche Normale (suggestions=false)
```json
{
  "success": true,
  "message": "Produits récupérés avec succès",
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Tomate cerise",
        "price": { "current": 4.50 },
        "unit": "kg",
        "images": { "main": "https://..." },
        "farm": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Ferme de la vallée",
          "image": "https://..."
        }
      }
    ],
    "totalItems": 25,
    "totalPages": 3,
    "currentPage": 1
  }
}
```

#### Mode Suggestions (suggestions=true)
```json
{
  "success": true,
  "message": "Suggestions récupérées avec succès",
  "data": ["tomate", "tomate cerise", "tomate cœur de bœuf"]
}
```

---

## 📊 Endpoint Analytics : `/api/products/trends`

### Paramètres

| Paramètre | Type | Défaut | Validation | Description |
|-----------|-------|----------|-------------|-------------|
| `limit` | integer | 10 | 1-50 | Nombre de tendances à retourner |
| `days` | integer | 30 | 1-365 | Période d'analyse en jours |
| `stats` | boolean | false | - | Inclure statistiques détaillées |

### Réponse

```json
{
  "success": true,
  "message": "Tendances récupérées avec succès",
  "data": {
    "trending": [
      {
        "term": "tomate",
        "count": 45,
        "growth": 23.5
      },
      {
        "term": "pomme",
        "count": 38,
        "growth": 15.2
      }
    ],
    "stats": {
      "totalSearches": 1250,
      "uniqueTerms": 89,
      "avgResponseTime": 120,
      "topCategories": [
        { "category": "légumes", "count": 156 },
        { "category": "fruits", "count": 142 }
      ]
    }
  }
}
```

---

## 🔄 Tri et Ordre

### Priorité de Tri (avec localisation)
1. **Distance** : Plus proches d'abord
2. **Note ferme** : Fermes mieux notées
3. **Date création** : Produits les plus récents

### Priorité de Tri (sans localisation)
1. **Note ferme** : Fermes mieux notées
2. **Date création** : Produits les plus récents

---

## 🎯 Exemples d'Utilisation

### Recherche Simple
```bash
GET /api/products/search?product=tomate
```

### Recherche avec Filtres Multiples
```bash
GET /api/products/search?product=pomme&farmId=507f1f77bcf86cd799439011&seasonal=true&limit=20&page=2
```

### Recherche Géolocalisée
```bash
GET /api/products/search?category=légumes&lat=48.8566&lng=2.3522&limit=15
```

### Mode Suggestions
```bash
GET /api/products/search?suggestions=true&product=cerise&limit=5
```

### Analytics des Tendances
```bash
GET /api/products/trends?limit=10&days=30&stats=true
```

---

## ⚠️ Codes d'Erreur

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Le terme de recherche est requis pour les suggestions"
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Erreur lors de la recherche des produits"
}
```

---

## 🔧 Notes Techniques

### Performance
- **Tracking asynchrone** : Non bloquant pour les requêtes utilisateur
- **Index optimisés** : Recherche efficace sur MongoDB
- **Cache suggestions** : Tendances mises en cache

### Sécurité
- **IP hashée** : Confidentialité des utilisateurs préservée
- **Validation stricte** : Tous les paramètres validés
- **Rate limiting** : Protection contre abus

### Analytics
- **Données collectées** : Termes, filtres, performance, localisation
- **Métriques calculées** : Tendances, croissance, statistiques
- **Périodes configurables** : 1-365 jours d'analyse

---

*MAJ : 17 Février 2026*
