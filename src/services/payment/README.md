# Service de Paiement - AzeFarm

Ce service gère les paiements via Monebil pour les commandes et les retraits.

## Architecture

### Mode Démo (Par défaut)
En mode démo, tous les paiements sont **automatiquement validés après 2 secondes**. Cela permet de développer et tester sans interagir avec l'API réelle de Monebil.

### Structure

```
src/
├── services/payment/
│   ├── demo.service.ts      # Service de paiement démo (validation auto)
│   ├── monebil.service.ts   # Service Monebil (prêt pour production)
│   └── index.ts             # Exports
├── controllers/payment/
│   └── payment.controller.ts # Contrôleur REST
├── router/
│   └── payment.router.ts     # Routes API
└── types/payment.types.ts    # Types TypeScript
```

## Configuration

Variables d'environnement à ajouter dans `.env` :

```env
# Mode de paiement: demo | test | production
PAYMENT_MODE=demo

# Clés API Monebil (requis en production)
MONEBIL_API_KEY=votre_api_key
MONEBIL_SECRET_KEY=votre_secret_key
MONEBIL_BASE_URL=https://api.monebil.cm

# Configuration technique
MONEBIL_TIMEOUT=30000
MONEBIL_RETRY_ATTEMPTS=3
```

## Routes API

Toutes les routes sont préfixées par `/api/v1/payments`.

### Endpoints

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/payments/order` | Initialiser un paiement pour une commande | ✅ |
| POST | `/payments/verify` | Vérifier le statut d'un paiement | ✅ |
| GET | `/payments/status/:transactionId` | Récupérer le statut d'un paiement | ❌ |
| POST | `/payments/callback` | Webhook Monebil | ❌ |
| POST | `/payments/cancel` | Annuler un paiement | ✅ |
| GET | `/payments/my-payments` | Lister mes paiements | ✅ |
| GET | `/payments/farm/:farmId` | Lister les paiements d'une ferme | ✅ |

### Exemples d'utilisation

#### Initialiser un paiement
```http
POST /api/v1/payments/order
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "cmd_123456",
  "amount": 15000,
  "phoneNumber": "+237690000000",
  "farmId": "farm_789"
}
```

Réponse (mode démo) :
```json
{
  "success": true,
  "transactionId": "demo_1709123456789_abc123",
  "status": "PENDING",
  "message": "Paiement initialisé avec succès (mode démo)",
  "otpRequired": true
}
```

#### Vérifier un paiement
```http
POST /api/v1/payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "transactionId": "demo_1709123456789_abc123"
}
```

## Méthodes de Paiement Supportées

- `ORANGE_MONEY` (défaut)
- `MTN_MOMO`
- `MOOV_MONEY`
- `WAVE`

## Types de Paiement

- `ORDER` - Paiement pour une commande
- `WITHDRAWAL` - Demande de retrait pour une ferme

## Passage en Production

Pour passer en production :

1. Obtenir les clés API Monebil
2. Modifier `PAYMENT_MODE=production` dans `.env`
3. Configurer les clés API :
   ```env
   MONEBIL_API_KEY=votre_vraie_cle_api
   MONEBIL_SECRET_KEY=votre_vrai_secret
   ```
4. Configurer l'URL de callback webhook dans le dashboard Monebil
5. Redémarrer le serveur

## Sécurité

- Vérification de signature HMAC pour les callbacks
- Rate limiting sur toutes les routes
- Authentification requise pour les opérations sensibles
- Validation des montants et informations de paiement

## Notes de Développement

- En mode démo, les paiements sont stockés dans `MobilePayment` avec status `PENDING` puis auto-validés après 2s
- Les commandes sont automatiquement confirmées (`CONFIRMED`) après validation du paiement
- Le statut `COMPLETED` indique un paiement réussi
- Le statut `FAILED` indique un paiement échoué ou annulé
