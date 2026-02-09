# 🌐 Guide d'Internationalisation (i18n)

Ce guide explique comment utiliser le système d'internationalisation intégré dans le template backend.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Utilisation dans les contrôleurs](#utilisation-dans-les-contrôleurs)
- [Utilisation dans les services](#utilisation-dans-les-services)
- [Ajouter de nouvelles traductions](#ajouter-de-nouvelles-traductions)
- [Tests](#tests)
- [Bonnes pratiques](#bonnes-pratiques)

## 🎯 Vue d'ensemble

Le système d'internationalisation permet de :
- Détecter automatiquement la langue depuis le header `Accept-Language`
- Traduire les messages de réponse API
- Gérer les paramètres dans les traductions
- Supporter le français et l'anglais (extensible)

## 🏗️ Architecture

```
src/
├── types/
│   └── i18n.types.ts          # Types TypeScript pour l'i18n
├── services/
│   └── I18nService.ts         # Service principal de traduction
├── middlewares/
│   ├── i18n.middleware.ts     # Middleware de détection de langue
│   └── i18nRequest.middleware.ts # Middleware pour les requêtes
├── utils/
│   └── apiResponse.ts         # Utilitaire de réponses traduites
├── locales/
│   ├── fr.ts                  # Traductions françaises
│   └── en.ts                  # Traductions anglaises
└── config/
    └── services.ts           # Conteneur de services
```

## 🚀 Utilisation dans les contrôleurs

### Réponse de succès basique

```typescript
public createItem = (req: Request, res: Response): void => {
  // Utiliser req.apiResponse.success() avec une clé de traduction
  (req as any).apiResponse.success({
    messageKey: 'crud.created',
    params: { resource: 'Article' },
    data: createdItem,
  });
};
```

### Réponse d'erreur

```typescript
public notFound = (req: Request, res: Response): void => {
  (req as any).apiResponse.notFound({
    messageKey: 'users.not_found',
    params: { userId: '123' },
  });
};
```

### Réponse paginée

```typescript
public listItems = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10 } = req.query;
  const result = await itemService.getItems(page, limit);
  
  (req as any).apiResponse.paginated(
    result.items,
    Number(page),
    Number(limit),
    result.total,
    {
      messageKey: 'crud.list_loaded',
      params: { count: result.items.length, resource: 'Article' },
    }
  );
};
```

### Accès direct au service i18n

```typescript
public customMessage = (req: Request, res: Response): void => {
  const i18n = (req as any).i18n;
  const language = (req as any).language;
  
  const message = i18n.translate('validation.required', language, {
    field: 'email',
  });
  
  res.json({ message });
};
```

## 🔧 Utilisation dans les services

### Injection du service i18n

```typescript
import { container, SERVICE_KEYS } from '../config/services';

export class EmailService {
  private i18n = container.get(SERVICE_KEYS.I18N_SERVICE);
  
  sendWelcomeEmail(userEmail: string, language: string): void {
    const subject = this.i18n.translate('emails.welcome.subject', language);
    // ... envoi de l'email
  }
}
```

### Traduction avec paramètres

```typescript
const message = this.i18n.translate('auth.login_success', 'fr', {
  username: 'JohnDoe',
});
```

## 📝 Ajouter de nouvelles traductions

### 1. Ajouter les clés dans les fichiers de traduction

**src/locales/fr.ts :**
```typescript
export const fr = {
  // ... traductions existantes
  products: {
    created: "Produit {name} créé avec succès",
    out_of_stock: "Le produit {name} est en rupture de stock",
  },
};
```

**src/locales/en.ts :**
```typescript
export const en = {
  // ... traductions existantes
  products: {
    created: "Product {name} created successfully",
    out_of_stock: "Product {name} is out of stock",
  },
};
```

### 2. Utiliser dans le code

```typescript
(req as any).apiResponse.success({
  messageKey: 'products.created',
  params: { name: 'iPhone 15' },
  data: product,
});
```

## 🧪 Tests

### Script de test automatisé

```bash
# Exécuter le script de test
./test-i18n.sh
```

### Tests manuels

```bash
# Test en français
curl -X GET "http://localhost:3000/api/v1/example/test" \
  -H "Accept-Language: fr-FR"

# Test en anglais
curl -X GET "http://localhost:3000/api/v1/example/test" \
  -H "Accept-Language: en-US"

# Test avec paramètres
curl -X GET "http://localhost:3000/api/v1/example/params" \
  -H "Accept-Language: fr-FR"
```

### Endpoints de test

- `GET /api/v1/example/test` - Test basique
- `GET /api/v1/example/error` - Test d'erreur 404
- `GET /api/v1/example/params` - Test avec paramètres
- `GET /api/v1/example/validation` - Test de validation
- `GET /api/v1/example/pagination` - Test de pagination

## 📚 Référence des clés de traduction

### Messages généraux
- `server.started` - Serveur démarré
- `server.error` - Erreur interne
- `server.not_found` - Ressource non trouvée

### Authentification
- `auth.login_success` - Connexion réussie
- `auth.login_failed` - Échec de connexion
- `auth.token_required` - Token requis

### CRUD générique
- `crud.created` - {resource} créé avec succès
- `crud.updated` - {resource} mis à jour
- `crud.deleted` - {resource} supprimé
- `crud.list_loaded` - {count} {resource}(s) chargé(s)

### Validation
- `validation.required` - Le champ {field} est requis
- `validation.invalid_email` - L'email n'est pas valide
- `validation.min_length` - Minimum {min} caractères

## ✨ Bonnes pratiques

### 1. Clés de traduction

- Utiliser des noms descriptifs et hiérarchiques
- Séparer les mots par des points (`.`)
- Grouper par fonctionnalité (`users.created`, `auth.login`)

### 2. Paramètres

- Utiliser des noms de paramètres clairs
- Entourer les paramètres d'accolades `{}` dans les traductions
- Toujours fournir les paramètres requis

### 3. Langues

- Toujours fournir une traduction en français (langue par défaut)
- Ajouter la traduction anglaise correspondante
- Les clés manquantes retournent la clé elle-même

### 4. Dans les contrôleurs

- Préférer `req.apiResponse` pour les réponses API
- Utiliser `req.i18n.translate()` pour les messages personnalisés
- Toujours inclure la langue dans les logs pour debugging

### 5. Performance

- Le service i18n est initialisé une seule fois au démarrage
- Les traductions sont chargées en mémoire
- Éviter les traductions dynamiques dans les boucles serrées

## 🔍 Débogage

### Vérifier la langue détectée

```typescript
console.log('Langue détectée:', (req as any).language);
console.log('Header Accept-Language:', req.headers['accept-language']);
```

### Vérifier les traductions disponibles

```typescript
const i18n = (req as any).i18n;
console.log('Traduction disponible:', i18n.translate('server.started'));
```

### Logs des traductions manquantes

Le système logge automatiquement les traductions non trouvées :
```
Translation not found for key: products.created in language: en
```

## 🚀 Prochaines améliorations

- [ ] Support des langues régionales (fr-FR, fr-CA, etc.)
- [ ] Cache des traductions pour Redis
- [ ] Système de rechargement à chaud des traductions
- [ ] Interface d'administration pour les traductions
- [ ] Export/import des traductions en CSV/JSON
