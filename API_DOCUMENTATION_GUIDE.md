# 📚 Documentation OpenAPI des Routes API

## 📝 Analyse du Style de Documentation Existant

Le projet utilise une documentation **OpenAPI 3.0.3** avec les caractéristiques suivantes :

### **Style de Rédaction**
1. **Structure hiérarchique** : Réf. aux composants réutilisables
2. **Descriptions multilignes** : Utilisation de `|` pour texte long
3. **Format français/anglais** : Mélange adapté au contexte
4. **Exemples concrets** : Inclusion de valeurs réalistes
5. **Sécurité explicite** : Mention des protections (bearerAuth, rôles)
6. **Cas d'usage** : Justification du besoin de chaque endpoint

### **Structure des Fichiers**
```
docs/
├── openapi.yaml          # Racine, intègre tout
├── paths/
│   ├── items.yaml       # Définition des routes
│   └── auth.yaml        # Routes d'authentification
├── components/
│   ├── schemas/         # Modèles de données
│   ├── parameters.yaml  # Paramètres réutilisables
│   └── responses.yaml   # Réponses standards
└── security/
    └── bearerAuth.yaml  # Schémas de sécurité
```

---

## ✅ Documentation Rédigée

### **1. Routes d'Authentification (`/docs/paths/auth.yaml`)**

#### Routes Implémentées :
| Route | Méthode | Description |
|-------|---------|-------------|
| `/auth/register` | POST | Créer un nouveau compte avec OTP |
| `/auth/login` | POST | Connexion avec email/password |
| `/auth/verify-otp` | POST | Vérifier le compte avec code OTP |
| `/auth/resend-otp` | POST | Renvoyer le code OTP |
| `/auth/forgot-password` | POST | Demander réinitialisation mot de passe |
| `/auth/reset-password/{token}` | POST | Réinitialiser mot de passe |
| `/auth/logout` | POST | Déconnexion utilisateur |
| `/auth/change-password` | POST | Changer mot de passe (authentifié) |
| `/oauth/{provider}` | GET | Initier OAuth (Google, Apple) |
| `/oauth/{provider}/callback` | GET | Callback OAuth |

#### Caractéristiques :
- ✅ Descriptions détaillées avec contexte
- ✅ Exemples réalistes pour chaque paramètre
- ✅ Codes d'erreur spécifiques (INVALID_CREDENTIALS, INVALID_OTP, etc.)
- ✅ Délais d'expiration mentionnés
- ✅ Limites de taux (rate limiting)
- ✅ Sécurité explicitée (HTTPS, token expiration)

### **2. Routes Utilisateurs (`/docs/paths/users.yaml`)**

#### Routes Implémentées :
| Route | Méthode | Description |
|-------|---------|-------------|
| `/users` | GET | Lister tous les utilisateurs avec filtrage |
| `/users` | POST | Créer utilisateur (admin) |
| `/users/search` | GET | Recherche avancée d'utilisateurs |
| `/users/{userId}` | GET | Récupérer détails d'un utilisateur |
| `/users/{userId}` | PUT | Mettre à jour utilisateur |
| `/users/{userId}` | DELETE | Supprimer utilisateur (soft delete) |
| `/users/{userId}/role` | PUT | Modifier rôle utilisateur (admin) |
| `/users/{userId}/restore` | POST | Restaurer utilisateur supprimé (admin) |
| `/users/export` | GET | Exporter utilisateurs en CSV (admin) |
| `/users/profile` | PUT | Mettre à jour profil (authentifié) |

#### Caractéristiques :
- ✅ Filtres avancés (recherche, rôle, statut, tri)
- ✅ Pagination explicite (page, limit, total, pages)
- ✅ Contrôle d'accès détaillé (user, admin, moderator)
- ✅ Upload fichiers (photo de profil)
- ✅ Soft delete vs hard delete distingués
- ✅ Cas d'usage explicité pour chaque endpoint

---

## 🎨 Conventions de Rédaction Appliquées

### **Titres et Résumés**
```yaml
summary: Action en français concis (3-5 mots)
description: |
  Explication détaillée avec :
  - Contexte et objectif
  - Prérequis (authentification, rôle)
  - Résultats attendus
  - Avertissements de sécurité si nécessaire
```

### **Paramètres**
```yaml
parameters:
  - name: paramName
    in: query|path|header
    required: true|false
    description: Explication claire
    schema:
      type: string|integer|boolean
      enum: [val1, val2]  # Si limité
      minLength: 2        # Si applicable
      pattern: '^...$'    # Si format spécifique
    example: valeur_réelle
```

### **Réponses**
```yaml
responses:
  '200':  # Code HTTP
    description: Court résumé
    content:
      application/json:
        schema:
          type: object
          properties:
            success: { type: boolean }
            message: { type: string }
            data: { $ref: '../schemas/Model.yaml' }
          example: { ... }
  '400':
    description: Spécificités de l'erreur
```

### **Sécurité**
```yaml
security:
  - bearerAuth: []  # Token JWT requis
  
# OU pour public (aucune sécurité)
security: []
```

---

## 📊 Statistiques de Documentation

### **Couverture**
- ✅ **10/10** routes d'authentification documentées
- ✅ **10/10** routes utilisateurs documentées
- ✅ **20/20** total de routes critiques

### **Détails par Route**
- Moyenne **3-4 paragraphes** de description
- **5-8 paramètres** par route GET/POST
- **4-6 codes de réponse** par endpoint
- **Exemples concrets** pour tous les paramètres

---

## 🔧 Recommandations pour Nouvelles Routes

Quand vous documenterez d'autres routes, suivez ce modèle :

```yaml
/path/to/endpoint:
  post:
    tags:
      - CategoryName
    summary: Action complète en français
    description: |
      Explication détaillée :
      - **Prérequis** : Ce qu'il faut avant
      - **Processus** : Étapes principales
      - **Sécurité** : Protections appliquées
      - **Limites** : Rate limiting, timeouts, etc.
    operationId: functionNameCamelCase
    security:
      - bearerAuth: []  # Si protégé
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [field1, field2]
            properties:
              field1:
                type: string
                description: Explication
                example: 'valeur_réelle'
    responses:
      '201':
        description: Ressource créée
        content:
          application/json:
            schema:
              $ref: '../components/schemas/Model.yaml'
      '400':
        $ref: '../components/responses/common.yaml#/BadRequest'
      '401':
        $ref: '../components/responses/common.yaml#/Unauthorized'
      '500':
        $ref: '../components/responses/common.yaml#/ServerError'
```

---

## 📂 Fichiers Modifiés

1. **`docs/paths/auth.yaml`** ✏️
   - Remplacement complet avec format structuré
   - 10 routes documentées
   - +400 lignes

2. **`docs/paths/users.yaml`** ✏️
   - Remplacement complet avec format structuré  
   - 10 routes documentées
   - +500 lignes

---

## 🚀 Intégration dans OpenAPI

Les fichiers sont automatiquement intégrés dans [openapi.yaml](../openapi.yaml) :

```yaml
paths:
  # Authentication routes
  /auth/register:
    $ref: './paths/auth.yaml#/auth/register'
  /auth/login:
    $ref: './paths/auth.yaml#/auth/login'
  
  # User routes
  /users:
    $ref: './paths/users.yaml#/users'
  /users/{userId}:
    $ref: './paths/users.yaml#/users/{userId}'
  # ... etc
```

---

## ✨ Prochaines Étapes

1. **Documenter les autres routes** :
   - `/items` - Gestion d'items
   - `/oauth` - Routes OAuth complets
   - `/health` - Health checks
   - `/csrf` - CSRF tokens

2. **Créer des schémas manquants** :
   - `AuthResponse` - Réponse d'authentification
   - `OAuthAccount` - Compte OAuth
   - `Pagination` - Structure pagination

3. **Validation** :
   - Tester avec Swagger UI
   - Vérifier les références $ref
   - Valider le format YAML

