# API de Suggestions de Produits

## Overview
L'API de suggestions permet d'obtenir des suggestions de produits en temps réel pour l'autocomplétion dans les champs de recherche.

## Endpoint

### `GET /api/v1/products/suggestions`

Retourne des suggestions de produits basées sur un terme de recherche partiel.

#### Paramètres

| Paramètre | Type | Requis | Description | Exemple |
|-----------|------|--------|-------------|---------|
| `q` | string | Oui | Terme de recherche (1-50 caractères) | `tom` |
| `limit` | integer | Non | Nombre de suggestions (1-20, défaut: 5) | `5` |

#### Réponse

```json
{
  "success": true,
  "data": ["Tomates", "Tomates cerises", "Sauces tomates"],
  "statusCode": 200,
  "message": "Suggestions récupérées avec succès",
  "meta": {
    "path": "/api/v1/products/suggestions?q=tom&limit=5",
    "url": "/api/v1/products/suggestions?q=tom&limit=5",
    "method": "GET",
    "ip": "::1",
    "userAgent": "curl/8.5.0",
    "responseTime": "170ms",
    "timestamp": "2026-02-16T12:08:51.000Z"
  }
}
```

#### Exemples d'utilisation

```bash
# Rechercher des produits contenant "tom"
curl -X GET "http://localhost:5001/api/v1/products/suggestions?q=tom&limit=5"

# Rechercher avec limite personnalisée
curl -X GET "http://localhost:5001/api/v1/products/suggestions?q=pom&limit=3"

# Recherche insensible à la casse
curl -X GET "http://localhost:5001/api/v1/products/suggestions?q=Lait"
```

## Caractéristiques

- **Recherche insensible à la casse** : `tom` trouve `Tomate`, `tomate`, `TOMATE`
- **Tri par pertinence** : Les résultats qui commencent par le terme en premier
- **Déduplication** : Évite les suggestions en double
- **Filtrage disponibilité** : Uniquement les produits disponibles
- **Performance optimisée** : Recherche indexée avec Prisma

## Codes d'erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 400 | Erreur de validation (paramètre manquant ou invalide) |
| 500 | Erreur serveur |

## Implémentation Frontend

### Exemple React avec autocomplétion

```jsx
import { useState, useEffect } from 'react';

function ProductSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/v1/products/suggestions?q=${query}&limit=5`
        );
        const data = await response.json();
        setSuggestions(data.data || []);
      } catch (error) {
        console.error('Erreur de suggestions:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un produit..."
      />
      {suggestions.length > 0 && (
        <ul>
          {suggestions.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Notes techniques

- La recherche utilise l'opérateur `contains` de Prisma avec mode `insensitive`
- Les résultats sont limités aux produits disponibles (`isAvailable: true`)
- Le tri favorise les résultats qui commencent par le terme de recherche
- La déduplication se base sur les noms de produits en minuscules
