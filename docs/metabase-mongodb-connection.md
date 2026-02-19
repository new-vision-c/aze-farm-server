# =====================================================================================================
# GUIDE DE CONNEXION MONGODB POUR METABASE
# =====================================================================================================
# Instructions détaillées pour connecter MongoDB à Metabase
# Basé sur le schéma Prisma d'Aze Farm Server
# =====================================================================================================

## 📋 PRÉREQUIS

1. **Metabase doit être démarré** : `./scripts/start-metabase.sh`
2. **MongoDB accessible** : Le replica set rs0 doit fonctionner
3. **Variables d'environnement configurées** : Vérifier le fichier .env

---

## 🔗 ÉTAPE 1 : AJOUTER LA SOURCE DE DONNÉES MONGODB

### 1. Accéder à Metabase
- URL : http://localhost:3002
- Email : `admin@azefarm.com`
- Password : [configuré dans .env]

### 2. Ajouter une source de données
1. Cliquez sur **"Add data"** → **"Database"**
2. Sélectionnez **"MongoDB"**
3. Remplissez les champs suivants :

#### Configuration principale
```
Display name: Aze Farm MongoDB
Host: mongo
Port: 27017
Database name: appDB
Username: admin
Password: [votre MONGO_PASSWORD du .env]
Authentication Database: admin
Use SSL: No
Use SSH tunnel: No
```

#### Configuration Replica Set
```
Replica Set: rs0
Additional hosts: [laisser vide]
Auth database: admin
```

#### Options avancées
```
Connection timeout: 30s
Query timeout: 60s
```

### 3. Tester la connexion
- Cliquez sur **"Test connection"**
- Si succès : **"Save"**
- Si échec : Vérifiez les identifiants et que MongoDB est accessible

---

## 📊 ÉTAPE 2 : COLLECTIONS PRINCIPALES À CONFIGURER

### Collections essentielles pour les KPIs business :

#### 1. `users` - Utilisateurs et rôles
**Champs importants :**
- `_id` : ObjectId
- `email` : String (unique)
- `role` : String ("FARMER" | "CONSUMER")
- `is_active` : Boolean
- `is_verified` : Boolean
- `created_at` : Date
- `last_login_at` : Date
- `latitude`/`longitude` : Float (géolocalisation)

**Requêtes utiles :**
```sql
-- Nombre d'utilisateurs par rôle
SELECT role, COUNT(*) as count FROM users GROUP BY role

-- Utilisateurs actifs (30 derniers jours)
SELECT COUNT(*) as active_users 
FROM users 
WHERE last_login_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
```

#### 2. `farms` - Fermes et géolocalisation
**Champs importants :**
- `_id` : ObjectId
- `name` : String
- `farmerId` : ObjectId (référence users._id)
- `isActive` : Boolean
- `ratingAvg` : Float
- `ratingCount` : Int
- `geoLocation.latitude` : Float
- `geoLocation.longitude` : Float
- `createdAt` : Date

**Requêtes utiles :**
```sql
-- Top 10 fermes par note moyenne
SELECT name, ratingAvg, ratingCount 
FROM farms 
WHERE isActive = true 
ORDER BY ratingAvg DESC 
LIMIT 10

-- Nombre de fermes actives
SELECT COUNT(*) as active_farms FROM farms WHERE isActive = true
```

#### 3. `products` - Produits et stocks
**Champs importants :**
- `_id` : ObjectId
- `name` : String
- `farmId` : ObjectId (référence farms._id)
- `price` : Float
- `stock` : Int
- `category` : String
- `isAvailable` : Boolean
- `seasonality` : Array[Int]
- `createdAt` : Date

**Requêtes utiles :**
```sql
-- Produits en rupture de stock
SELECT name, category, farmId 
FROM products 
WHERE stock = 0 AND isAvailable = true

-- Produits les plus chers par catégorie
SELECT category, AVG(price) as avg_price 
FROM products 
WHERE isAvailable = true 
GROUP BY category
```

#### 4. `orders` - Commandes et statuts
**Champs importants :**
- `_id` : ObjectId
- `orderNumber` : String
- `status` : String ("PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED")
- `totalAmount` : Float
- `orderDate` : Date
- `consumerId` : ObjectId (référence users._id)
- `farmId` : ObjectId (référence farms._id)
- `createdAt` : Date

**Requêtes utiles :**
```sql
-- Chiffre d'affaires par mois
SELECT 
  DATE_FORMAT(orderDate, '%Y-%m') as month,
  SUM(totalAmount) as revenue,
  COUNT(*) as order_count
FROM orders 
WHERE status != 'CANCELLED'
GROUP BY month
ORDER BY month DESC

-- Statistiques des commandes par statut
SELECT status, COUNT(*) as count, SUM(totalAmount) as total_amount
FROM orders
GROUP BY status
```

#### 5. `mobile_payments` - Paiements et méthodes
**Champs importants :**
- `_id` : ObjectId
- `amount` : Float
- `method` : String ("ORANGE_MONEY" | "MTN_MONEY" | "WAVE" | "MOOV_MONEY")
- `status` : String ("PENDING" | "INITIATED" | "COMPLETED" | "FAILED" | "REFUNDED")
- `phoneNumber` : String
- `paidAt` : Date
- `userId` : ObjectId (référence users._id)
- `createdAt` : Date

**Requêtes utiles :**
```sql
-- Répartition des méthodes de paiement
SELECT method, COUNT(*) as count, SUM(amount) as total_amount
FROM mobile_payments 
WHERE status = 'COMPLETED'
GROUP BY method

-- Taux d'échec des paiements
SELECT 
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
  COUNT(*) as total,
  (COUNT(CASE WHEN status = 'FAILED' THEN 1 END) * 100.0 / COUNT(*)) as failure_rate
FROM mobile_payments
```

#### 6. `carts` - Paniers et conversion
**Champs importants :**
- `_id` : ObjectId
- `status` : String ("ACTIVE" | "CONVERTED" | "ABANDONED")
- `totalItems` : Int
- `totalAmount` : Float
- `userId` : ObjectId (référence users._id)
- `farmId` : ObjectId (référence farms._id)
- `expiresAt` : Date
- `createdAt` : Date

**Requêtes utiles :**
```sql
-- Taux de conversion panier → commande
SELECT 
  COUNT(CASE WHEN status = 'CONVERTED' THEN 1 END) as converted,
  COUNT(CASE WHEN status = 'ABANDONED' THEN 1 END) as abandoned,
  COUNT(*) as total,
  (COUNT(CASE WHEN status = 'CONVERTED' THEN 1 END) * 100.0 / COUNT(*)) as conversion_rate
FROM carts

-- Paniers abandonnés (derniers 7 jours)
SELECT COUNT(*) as abandoned_carts
FROM carts 
WHERE status = 'ABANDONED' 
AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
```

#### 7. `search_analytics` - Analytics de recherche
**Champs importants :**
- `_id` : ObjectId
- `searchTerm` : String
- `searchType` : String
- `resultCount` : Int
- `responseTime` : Int (ms)
- `filters` : Json
- `createdAt` : Date

**Requêtes utiles :**
```sql
-- Termes de recherche les plus populaires
SELECT searchTerm, COUNT(*) as search_count, AVG(resultCount) as avg_results
FROM search_analytics 
GROUP BY searchTerm 
ORDER BY search_count DESC 
LIMIT 20

-- Temps de réponse moyen des recherches
SELECT AVG(responseTime) as avg_response_time
FROM search_analytics 
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 1 DAY)
```

---

## 🎯 ÉTAPE 3 : CRÉER LES MODÈLES DE DONNÉES

### 1. Configurer les relations
Dans Metabase, allez dans **"Data Model"** pour définir :

#### Relations principales :
- `users._id` → `farms.farmerId` (One-to-Many)
- `users._id` → `orders.consumerId` (One-to-Many)
- `farms._id` → `products.farmId` (One-to-Many)
- `farms._id` → `orders.farmId` (One-to-Many)
- `orders._id` → `mobile_payments.orderId` (One-to-One)
- `users._id` → `carts.userId` (One-to-Many)

### 2. Types de données à vérifier
- **Dates** : `created_at`, `orderDate`, `paidAt` → DateTime
- **Montants** : `price`, `totalAmount`, `amount` → Number/Decimal
- **Coordonnées** : `latitude`, `longitude` → Number/Float
- **Booléens** : `isActive`, `isAvailable`, `is_verified` → Boolean

---

## 🔍 ÉTAPE 4 : VALIDATION

### Tests à effectuer :
1. **Connexion MongoDB** : ✅ Accessible
2. **Collections visibles** : ✅ Toutes les collections apparaissent
3. **Requêtes simples** : ✅ SELECT basiques fonctionnent
4. **Jointures** : ✅ Relations entre collections fonctionnent
5. **Types de données** : ✅ Dates et montants corrects

### En cas de problème :
- **Erreur de connexion** : Vérifiez que MongoDB est accessible avec `docker-compose exec mongo mongosh`
- **Collections vides** : Vérifiez que la base contient des données avec `use appDB; db.getCollectionNames()`
- **Requêtes lentes** : Ajoutez des index MongoDB si nécessaire

---

## 📈 PROCHAINES ÉTAPES

Une fois la connexion MongoDB validée :

1. **Créer les dashboards** (Étape 3)
2. **Configurer les alertes** (Étape 4)
3. **Documenter les procédures** (Étape 4)

---

## 🆘 SUPPORT

- **Logs Metabase** : `docker-compose -f docker-compose.metabase.yml logs metabase`
- **Logs MongoDB** : `docker-compose logs mongo`
- **Redémarrage Metabase** : `docker-compose -f docker-compose.metabase.yml restart metabase`

---

_**Note** : Ce guide est basé sur le schéma Prisma v1.0. Toute modification du schéma devra être répercutée dans Metabase._
