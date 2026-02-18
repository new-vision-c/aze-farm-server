# TODO - Implémentation Metabase pour Aze Farm Server

## 📋 Vue d'ensemble

Ce document détaille les étapes nécessaires pour implémenter Metabase comme
solution de Business Intelligence pour le projet Aze Farm Server.

## 🎯 Objectifs

- Mettre en place Metabase pour l'analyse business
- Créer des dashboards pour les KPIs essentiels
- Compléter le stack monitoring existant (Prometheus/Grafana)

---

## ✅ Tâches à Réaliser

### 🚀 Phase 1 : Infrastructure (Haute Priorité)

- [ ] **Créer le fichier docker-compose.metabase.yml** avec Metabase et
      PostgreSQL
  - Configurer les volumes persistants
  - Définir les variables d'environnement
  - Intégrer au réseau backend existant

- [ ] **Configurer la connexion MongoDB dans Metabase**
  - Ajouter MongoDB comme source de données
  - Tester la connexion avec le replica set
  - Valider l'accès aux collections principales

### 📊 Phase 2 : Dashboards Business (Haute Priorité)

- [ ] **Créer les dashboards business principaux dans Metabase**
  - Dashboard Vue Générale Business
  - Dashboard Performance Fermes
  - Dashboard Analyse Produits
  - Dashboard Opérations

### 🔍 Phase 3 : Requêtes et KPIs (Moyenne Priorité)

- [ ] **Implémenter les requêtes MongoDB pour les KPIs essentiels**
  - Chiffre d'affaires journalier
  - Top fermes par CA
  - Produits les plus vendus
  - Taux de conversion panier → commande

- [ ] **Configurer les alertes Metabase pour les seuils critiques**
  - CA journalier < 80% de la moyenne
  - Taux d'échec paiement > 5%
  - Stock critique < 10 produits
  - Temps de réponse API > 2s

### 📚 Phase 4 : Documentation et Tests (Basse/Moyenne Priorité)

- [ ] **Documenter l'utilisation et la maintenance des dashboards**
  - Guide utilisateur Metabase
  - Procédures de mise à jour
  - Bonnes pratiques d'analyse

- [ ] **Tester l'intégration avec le stack monitoring existant**
  - Validation croisée Metabase ↔ Grafana
  - Tests de charge
  - Validation des alertes

---

## 📁 Fichiers à Créer

### 1. `docker-compose.metabase.yml`

```yaml
services:
  metabase:
    image: metabase/metabase:latest
    container_name: metabase
    restart: unless-stopped
    environment:
      MB_DB_TYPE: postgres
      MB_DB_DBNAME: metabase
      MB_DB_PORT: 5432
      MB_DB_USER: metabase
      MB_DB_PASS: metabase_password
      MB_DB_HOST: postgres-metabase
    ports:
      - "3002:3000"
    networks:
      - backend_network
    depends_on:
      - postgres-metabase

  postgres-metabase:
    image: postgres:15
    container_name: postgres-metabase
    environment:
      POSTGRES_DB: metabase
      POSTGRES_USER: metabase
      POSTGRES_PASSWORD: metabase_password
    volumes:
      - metabase_data:/var/lib/postgresql/data
    networks:
      - backend_network

volumes:
  metabase_data:
```

### 2. `scripts/metabase-setup.sql`

```sql
-- Script d'initialisation pour Metabase
-- À exécuter après le premier démarrage
```

---

## 🔗 Connexions MongoDB

### Configuration de la source de données

```
Type: MongoDB
Host: mongo
Port: 27017
Database: appDB
Username: admin
Password: secret123
Authentication Database: admin
Replica Set: rs0
```

### Collections à analyser

- `users` - Utilisateurs et rôles
- `farms` - Fermes et géolocalisation
- `products` - Produits et stocks
- `orders` - Commandes et statuts
- `mobile_payments` - Paiements et méthodes
- `carts` - Paniers et conversion
- `search_analytics` - Analytics de recherche

---

## 📈 KPIs Essentiels à Surveiller

### Business KPIs

- **Chiffre d'affaires** quotidien/hebdomadaire/mensuel
- **Nombre de commandes** par période
- **Panier moyen (AOV)**
- **Répartition des méthodes de paiement**
- **Taux de conversion** panier → commande

### Performance Fermes

- **Top 10 des fermes** par CA
- **Note moyenne** des fermes
- **Nombre de produits** par ferme
- **Répartition géographique** des fermes

### Analyse Produits

- **Produits les plus vendus**
- **Catégories les plus populaires**
- **Produits en rupture de stock**
- **Analyse de saisonnalité**

### Comportement Utilisateurs

- **Utilisateurs actifs (DAU/MAU)**
- **Répartition FARMER vs CONSUMER**
- **Taux de vérification email**
- **Paniers abandonnés**

---

## 🚨 Seuils d'Alerte

### Critiques

- CA journalier < 80% de la moyenne sur 7 jours
- Taux d'échec paiement > 5%
- Stock critique < 10 produits
- Temps de réponse API > 2s

### Avertissements

- Nouveaux utilisateurs < 5/jour
- Taux de conversion < 2%
- Produits sans mise à jour > 30 jours

---

## 📚 Documentation Complémentaire

- [Guide utilisateur Metabase](./docs/metabase-user-guide.md)
- [Requêtes MongoDB prédéfinies](./docs/metabase-queries.md)
- [Configuration des alertes](./docs/metabase-alerts.md)

---

## 🎯 Succès du Projet

**Critères de validation :**

- ✅ Metabase accessible et fonctionnel
- ✅ Dashboards business créés et opérationnels
- ✅ Alertes configurées et testées
- ✅ Documentation complète
- ✅ Intégration validée avec stack existant

**Délai estimé :** 2-3 jours pour l'implémentation complète

---

_Mis à jour le 18 février 2026_
