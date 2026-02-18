# Documentation API - Système de Notation et de Favoris

## Table des matières

- [Système de Notation des Fermes](#système-de-notation-des-fermes)
- [Système de Favoris](#système-de-favoris)
- [Codes d'Erreur](#codes-derreur)
- [Exemples d'Utilisation](#exemples-dutilisation)

---

## Système de Notation des Fermes

### Overview
Le système de notation permet aux utilisateurs de noter les fermes sur une échelle de 1 à 5 étoiles, avec la possibilité de laisser un commentaire. Chaque utilisateur ne peut noter qu'une fois chaque ferme.

### Endpoints

#### 1. Noter une ferme (créer ou modifier)
```http
POST /api/v1/farms/{farmId}/rating
```

**Description** : Ajoute une note à une ferme ou modifie la note existante de l'utilisateur.

**Authentification** : Requise

**Paramètres** :
- `farmId` (string, path) : ID de la ferme à noter

**Corps de la requête** :
```json
{
  "score": 5,
  "comment": "Excellente ferme bio avec des produits de qualité !"
}
```

**Réponse** (201) :
```json
{
  "success": true,
  "message": "Note enregistrée avec succès",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "score": 5,
    "comment": "Excellente ferme bio avec des produits de qualité !",
    "user": {
      "id": "507f1f77bcf86cd799439012",
      "fullname": "Jean Dupont"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 2. Supprimer sa note
```http
DELETE /api/v1/farms/{farmId}/rating
```

**Description** : Supprime la note de l'utilisateur pour une ferme.

**Authentification** : Requise

**Paramètres** :
- `farmId` (string, path) : ID de la ferme

**Réponse** (200) :
```json
{
  "success": true,
  "message": "Note supprimée avec succès",
  "data": null
}
```

#### 3. Voir toutes les notes d'une ferme
```http
GET /api/v1/farms/{farmId}/ratings?page=1&limit=10
```

**Description** : Récupère toutes les notes d'une ferme avec pagination.

**Authentification** : Non requise

**Paramètres** :
- `farmId` (string, path) : ID de la ferme
- `page` (integer, query) : Page actuelle (défaut: 1)
- `limit` (integer, query) : Nombre de notes par page (défaut: 10, max: 50)

**Réponse** (200) :
```json
{
  "success": true,
  "message": "Notes récupérées avec succès",
  "data": {
    "ratings": [
      {
        "id": "507f1f77bcf86cd799439011",
        "score": 5,
        "comment": "Excellente ferme bio !",
        "user": {
          "id": "507f1f77bcf86cd799439012",
          "fullname": "Jean Dupont"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 25,
    "totalPages": 3,
    "currentPage": 1
  }
}
```

#### 4. Voir sa note pour une ferme
```http
GET /api/v1/farms/{farmId}/my-rating
```

**Description** : Récupère la note de l'utilisateur connecté pour une ferme.

**Authentification** : Requise

**Paramètres** :
- `farmId` (string, path) : ID de la ferme

**Réponse** (200) :
```json
{
  "success": true,
  "message": "Note utilisateur récupérée avec succès",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "score": 5,
    "comment": "Excellente ferme bio !",
    "user": {
      "id": "507f1f77bcf86cd799439012",
      "fullname": "Jean Dupont"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 5. Statistiques de notation d'une ferme
```http
GET /api/v1/farms/{farmId}/rating-stats
```

**Description** : Récupère les statistiques détaillées des notes d'une ferme.

**Authentification** : Non requise

**Paramètres** :
- `farmId` (string, path) : ID de la ferme

**Réponse** (200) :
```json
{
  "success": true,
  "message": "Statistiques récupérées avec succès",
  "data": {
    "average": 4.2,
    "count": 25,
    "distribution": {
      "1": 1,
      "2": 2,
      "3": 5,
      "4": 8,
      "5": 9
    }
  }
}
```

#### 6. Vérifier si on peut noter une ferme
```http
GET /api/v1/farms/{farmId}/can-rate
```

**Description** : Vérifie si l'utilisateur peut encore noter cette ferme.

**Authentification** : Requise

**Paramètres** :
- `farmId` (string, path) : ID de la ferme

**Réponse** (200) :
```json
{
  "success": true,
  "message": "Vérification terminée avec succès",
  "data": {
    "canRate": true
  }
}
```

---

## Système de Favoris

### Overview
Le système de favoris permet aux utilisateurs de sauvegarder leurs produits préférés pour y accéder rapidement. Chaque utilisateur peut ajouter un produit en favori une seule fois.

### Endpoints

#### 1. Ajouter un produit en favori
```http
POST /api/v1/favorites
```

**Description** : Ajoute un produit aux favoris de l'utilisateur.

**Authentification** : Requise

**Corps de la requête** :
```json
{
  "productId": "507f1f77bcf86cd799439011"
}
```

**Réponse** (201) :
```json
{
  "success": true,
  "message": "Produit ajouté aux favoris avec succès",
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439012",
    "productId": "507f1f77bcf86cd799439011",
    "product": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Tomates Bio",
      "price": 4.50,
      "unit": "kg",
      "image": "https://example.com/tomates.jpg",
      "farm": {
        "id": "507f1f77bcf86cd799439014",
        "name": "Ferme du Soleil"
      }
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 2. Supprimer un produit des favoris
```http
DELETE /api/v1/favorites/{productId}
```

**Description** : Supprime un produit des favoris de l'utilisateur.

**Authentification** : Requise

**Paramètres** :
- `productId` (string, path) : ID du produit à supprimer

**Réponse** (200) :
```json
{
  "success": true,
  "message": "Produit retiré des favoris avec succès",
  "data": null
}
```

#### 3. Basculer le statut de favori
```http
POST /api/v1/favorites/toggle
```

**Description** : Ajoute ou supprime un produit des favoris selon son état actuel.

**Authentification** : Requise

**Corps de la requête** :
```json
{
  "productId": "507f1f77bcf86cd799439011"
}
```

**Réponse** (200) :
```json
{
  "success": true,
  "message": "Produit ajouté aux favoris",
  "data": {
    "isAdded": true
  }
}
```

#### 4. Voir tous ses favoris
```http
GET /api/v1/favorites?page=1&limit=10
```

**Description** : Récupère tous les favoris de l'utilisateur avec pagination.

**Authentification** : Requise

**Paramètres** :
- `page` (integer, query) : Page actuelle (défaut: 1)
- `limit` (integer, query) : Nombre de favoris par page (défaut: 10, max: 50)

**Réponse** (200) :
```json
{
  "success": true,
  "message": "Favoris récupérés avec succès",
  "data": {
    "favorites": [
      {
        "id": "507f1f77bcf86cd799439013",
        "userId": "507f1f77bcf86cd799439012",
        "productId": "507f1f77bcf86cd799439011",
        "product": {
          "id": "507f1f77bcf86cd799439011",
          "name": "Tomates Bio",
          "price": 4.50,
          "unit": "kg",
          "image": "https://example.com/tomates.jpg",
          "farm": {
            "id": "507f1f77bcf86cd799439014",
            "name": "Ferme du Soleil"
          }
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 15,
    "totalPages": 2,
    "currentPage": 1
  }
}
```

#### 5. Vérifier si un produit est en favori
```http
GET /api/v1/favorites/check/{productId}
```

**Description** : Vérifie si un produit est dans les favoris de l'utilisateur.

**Authentification** : Requise

**Paramètres** :
- `productId` (string, path) : ID du produit à vérifier

**Réponse** (200) :
```json
{
  "success": true,
  "message": "Vérification terminée avec succès",
  "data": {
    "isFavorite": true
  }
}
```

#### 6. Compter ses favoris
```http
GET /api/v1/favorites/count
```

**Description** : Récupère le nombre total de favoris de l'utilisateur.

**Authentification** : Requise

**Réponse** (200) :
```json
{
  "success": true,
  "message": "Nombre de favoris récupéré avec succès",
  "data": {
    "count": 15
  }
}
```

#### 7. Récupérer les IDs des favoris
```http
GET /api/v1/favorites/ids
```

**Description** : Récupère uniquement les IDs des produits favoris de l'utilisateur.

**Authentification** : Requise

**Réponse** (200) :
```json
{
  "success": true,
  "message": "IDs des favoris récupérés avec succès",
  "data": {
    "favoriteIds": [
      "507f1f77bcf86cd799439011",
      "507f1f77bcf86cd799439015",
      "507f1f77bcf86cd799439016"
    ]
  }
}
```

---

## Codes d'Erreur

### Codes HTTP communs

| Code | Description | Exemple de réponse |
|------|-------------|-------------------|
| 200 | Succès | Réponse avec les données demandées |
| 201 | Créé | Ressource créée avec succès |
| 400 | Bad Request | Paramètres invalides |
| 401 | Non autorisé | Authentification requise |
| 404 | Non trouvé | Ressource non trouvée |
| 500 | Erreur serveur | Erreur interne du serveur |

### Réponses d'erreur standards

```json
{
  "success": false,
  "message": "Message d'erreur détaillé",
  "error": {
    "code": "ERROR_CODE",
    "details": "Informations supplémentaires sur l'erreur"
  }
}
```

### Messages d'erreur spécifiques

#### Notation des fermes
- `"Ferme non trouvée"` : La ferme spécifiée n'existe pas
- `"La note doit être comprise entre 1 et 5"` : Score invalide
- `"Aucune note trouvée pour cet utilisateur et cette ferme"` : Pas de note à supprimer
- `"Produit déjà en favori"` : L'utilisateur a déjà noté cette ferme

#### Favoris
- `"Produit non trouvé"` : Le produit spécifié n'existe pas
- `"Produit déjà en favori"` : Le produit est déjà dans les favoris
- `"Aucun favori trouvé pour ce produit"` : Pas de favori à supprimer
- `"Utilisateur non trouvé"` : L'utilisateur n'existe pas

---

## Exemples d'Utilisation

### Exemple 1 : Noter une ferme

```bash
# 1. Noter une ferme
curl -X POST "http://localhost:3000/api/v1/farms/507f1f77bcf86cd799439014/rating" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 5,
    "comment": "Ferme exceptionnelle avec des produits de grande qualité !"
  }'

# 2. Voir les statistiques de la ferme
curl "http://localhost:3000/api/v1/farms/507f1f77bcf86cd799439014/rating-stats"
```

### Exemple 2 : Gérer ses favoris

```bash
# 1. Ajouter un produit en favori
curl -X POST "http://localhost:3000/api/v1/favorites" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439011"
  }'

# 2. Vérifier si le produit est en favori
curl "http://localhost:3000/api/v1/favorites/check/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Voir tous ses favoris
curl "http://localhost:3000/api/v1/favorites?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Exemple 3 : Recherche avec favoris

```bash
# Rechercher des produits en mettant les favoris en premier
curl "http://localhost:3000/api/v1/products/search?productName=tomate&favorites=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Notes Techniques

### Performance
- Les favoris sont mis en cache Redis pour une récupération rapide
- Les statistiques de notation sont calculées en temps réel
- La pagination est limitée à 50 résultats maximum par requête

### Sécurité
- Toutes les opérations d'écriture nécessitent une authentification JWT
- Un utilisateur ne peut noter qu'une fois chaque ferme
- Un utilisateur ne peut ajouter qu'une fois chaque produit en favori
- Validation stricte des entrées pour prévenir les injections

### Cache
- Les favoris sont mis en cache avec une TTL de 1 heure par défaut
- Le cache est automatiquement invalidé lors des modifications
- Les statistiques de notation ne sont pas mises en cache pour rester en temps réel

### Limites
- Score de notation : 1 à 5 (entier)
- Commentaire : maximum 500 caractères
- Pagination : 1 à 50 résultats par page
- Un utilisateur peut avoir un nombre illimité de favoris

---

## Dernière mise à jour
**Date** : 18 janvier 2024  
**Version** : 1.0.0  
**Auteur** : Équipe de développement Aze Farm Server
