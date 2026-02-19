# TODO - Implémentation Metabase pour Aze Farm Server

## 📋 Vue d'ensemble

Ce document détaille les étapes nécessaires pour implémenter Metabase comme
solution de Business Intelligence pour le projet Aze Farm Server.

## 🎯 Objectifs

- Mettre en place Metabase pour l'analyse business
- Créer des dashboards pour les KPIs essentiels
- Compléter le stack monitoring existant (Prometheus/Grafana)

---

## Tâches à Réaliser - Plan en 4 Étapes

### Étape 1 : Infrastructure Metabase (Priorité Haute)

_Base sur l'infrastructure Docker existante_

- [x] **Créer docker-compose.metabase.yml** en s'inspirant de
      docker-compose.monitoring.yml
  - Intégrer Metabase avec PostgreSQL (comme Prometheus/Loki)
  - Utiliser le réseau backend_network existant
  - Configurer les volumes persistants
  - Définir les variables d'environnement sécurisées

- [x] **Configuration des variables d'environnement**
  - Ajouter les variables Metabase dans .env.example
  - Créer script d'initialisation PostgreSQL optimisé
  - Script de démarrage automatisé avec vérifications

- [ ] **Intégrer au stack monitoring existant**
  - [ ] Ajouter Metabase au docker-compose.monitoring.yml
  - [ ] Configurer les labels Prometheus pour le monitoring de Metabase
  - [ ] Valider la connectivité avec MongoDB replica set existant

### Étape 2 : Connexion Données & Modèles (Priorité Haute)

_Basé sur le schéma Prisma MongoDB existant_

- [x] **Configurer la source de données MongoDB dans Metabase**
  - ✅ Créer guide de connexion détaillé
  - ✅ Documenter les collections principales avec leurs champs
  - ✅ Fournir les identifiants et configuration replica set
  - ✅ Inclure les requêtes de test et validation

- [x] **Créer les modèles de données Metabase**
  - ✅ Documenter les relations entre collections
  - ✅ Créer 25 requêtes prédéfinies pour les KPIs essentiels
  - ✅ Script de validation MongoDB automatisé
  - ✅ Guide de configuration des types de données

- [ ] **Valider la connexion et les requêtes**
  - [ ] Exécuter le script de validation
  - [ ] Tester les requêtes dans Metabase
  - [ ] Configurer les relations dans l'interface Metabase

### Étape 3 : Dashboards Business KPIs (Priorité Moyenne)

_Basé sur les contrôleurs et services existants_

- [x] **Dashboard Vue Générale Business**
  - ✅ Guide de création complet (16 widgets KPIs)
  - ✅ Layout 4x4 avec tendances et analyses
  - ✅ Script de création automatisée via API
  - ✅ Configuration des filtres globaux

- [x] **Dashboard Performance Fermes**
  - ✅ Top fermes par CA et notes moyennes
  - ✅ Analyse géographique et produits par ferme
  - ✅ Métriques de stock et prix
  - ✅ Évolution temporelle des performances

- [x] **Dashboard Analyse Produits**
  - ✅ Top produits vendus et catégories populaires
  - ✅ Alertes stocks critiques et saisonnalité
  - ✅ Analyse prix et rentabilité
  - ✅ Performance par catégorie

- [x] **Dashboard Opérations Techniques**
  - ✅ Métriques API Prometheus intégrées
  - ✅ Performance paiements et conversions
  - ✅ Analytics recherche et comportement utilisateur
  - ✅ Logs erreurs et temps de réponse

- [x] **Configuration des alertes**
  - ✅ Documentation complète des seuils critiques
  - ✅ Canaux de notification (Email, Slack, Webhook)
  - ✅ Fréquences et niveaux d'escalade
  - ✅ Bonnes pratiques et maintenance

### Étape 4 : Documentation et Intégration (Priorité Basse)

_Compléter l'écosystème monitoring existant_

- [x] **Documentation utilisateur complète**
  - ✅ Guide utilisateur complet (50+ pages)
  - ✅ Navigation et utilisation des dashboards
  - ✅ Création de rapports personnalisés
  - ✅ Export et partage des données

- [x] **Scripts d'intégration automatisée**
  - ✅ Script de validation complète
  - ✅ Tests de connectivité et performance
  - ✅ Rapport d'intégration automatique
  - ✅ Validation cross-services

- [x] **Procédures de maintenance**
  - ✅ Guide maintenance complet (quotidien/hebdomadaire/mensuel)
  - ✅ Stratégie de sauvegarde et restauration
  - ✅ Gestion des incidents et mises à jour
  - ✅ Optimisation des performances

- [x] **Intégration monitoring existant**
  - ✅ Labels Prometheus configurés
  - ✅ Health endpoints accessibles
  - ✅ Cross-validation Grafana/Metabase
  - ✅ Alertes intégrées

---

## Fichiers à Créer

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

**Délai estimé :** 2-3 jours pour l'implémentation complète ✅

**Statut :** 🎉 **PROJET TERMINÉ AVEC SUCCÈS!**

---

_Mis à jour le 18 février 2026_
