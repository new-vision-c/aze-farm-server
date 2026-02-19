# =====================================================================================================
# GUIDE DE CRÉATION DES DASHBOARDS METABASE
# =====================================================================================================
# Instructions détaillées pour créer les 4 dashboards business principaux
# Basé sur les requêtes prédéfinies et les KPIs d'Aze Farm Server
# =====================================================================================================

## 📋 PRÉREQUIS

1. **Metabase connecté à MongoDB** : Étape 2 complétée
2. **Requêtes SQL importées** : Depuis `docs/metabase-queries.md`
3. **Collections accessibles** : users, farms, products, orders, mobile_payments, carts

---

## 🎯 DASHBOARD 1 : VUE GÉNÉRALE BUSINESS

### Objectif
Vue d'ensemble des performances globales de l'entreprise en temps réel.

### Layout recommandé : 4x4 (16 widgets)

#### Ligne 1 : KPIs Principaux
1. **Chiffre d'affaires mensuel** (Requête #2)
   - Type : Number
   - Titre : "CA Mensuel"
   - Format : Monétaire (XOF)
   - Période : 30 derniers jours

2. **Nombre total d'utilisateurs** (Requête #6)
   - Type : Number
   - Titre : "Utilisateurs Totals"
   - Sous-titre : "CONSUMER vs FARMER"

3. **Commandes du mois** (Requête #2)
   - Type : Number
   - Titre : "Commandes Mensuelles"
   - Comparaison : vs mois précédent

4. **Panier moyen** (Requête #19)
   - Type : Number
   - Titre : "Panier Moyen"
   - Format : Monétaire (XOF)

#### Ligne 2 : Tendances
5. **Évolution CA journalier** (Requête #1)
   - Type : Line chart
   - Titre : "CA Journalier (30j)"
   - Axe X : Date
   - Axe Y : Revenue

6. **Utilisateurs actifs par jour** (Requête #5)
   - Type : Line chart
   - Titre : "Utilisateurs Actifs Quotidiens"
   - Séries : CONSUMER, FARMER

7. **Répartition méthodes paiement** (Requête #3)
   - Type : Pie chart
   - Titre : "Méthodes de Paiement"
   - Pourcentage du total

8. **Taux de conversion paniers** (Requête #4)
   - Type : Gauge
   - Titre : "Taux de Conversion"
   - Seuils : 0-5% (rouge), 5-10% (orange), 10%+ (vert)

#### Lignes 3-4 : Analyses détaillées
9. **Nouveaux utilisateurs par mois** (Requête #7)
   - Type : Bar chart
   - Titre : "Croissance Utilisateurs"
   - Groupé par rôle

10. **Distribution montants commandes** (Requête #20)
    - Type : Bar chart
    - Titre : "Répartition Paniers"
    - Tranches de montant

11. **Taux échec paiements** (Requête #18)
    - Type : Number + Trend
    - Titre : "Taux d'Échec Paiements"
    - Période : 30 derniers jours

12. **Temps moyen traitement commandes** (Requête #24)
    - Type : Number
    - Titre : "Temps Traitement Moyen"
    - Unité : Heures

---

## 🏆 DASHBOARD 2 : PERFORMANCE FERMES

### Objectif
Analyser la performance des fermes et identifier les meilleures opportunités.

### Layout recommandé : 4x4 (16 widgets)

#### Ligne 1 : Top Fermes
1. **Top 10 fermes par CA** (Requête #9)
   - Type : Table
   - Titre : "Top Fermes par CA"
   - Colonnes : Nom, CA, Commandes, Note

2. **Top 10 fermes par note** (Requête #10)
   - Type : Table
   - Titre : "Meilleures Notes"
   - Colonnes : Nom, Note, Avis

3. **Nombre total de fermes actives** (Requête #10)
   - Type : Number
   - Titre : "Fermes Actives"

4. **Note moyenne globale** (Requête #10)
   - Type : Number
   - Titre : "Note Moyenne"
   - Format : 1-5 étoiles

#### Ligne 2 : Géographie et Produits
5. **Répartition géographique fermes** (Requête #12)
   - Type : Map ou Pie chart
   - Titre : "Fermes par Région"
   - Régions : Centre, Ouest, Est, Sud

6. **Produits par ferme** (Requête #11)
   - Type : Bar chart
   - Titre : "Nombre de Produits par Ferme"
   - Top 15 fermes

7. **Stock total par ferme** (Requête #11)
   - Type : Bar chart
   - Titre : "Stock Total par Ferme"
   - Top 15 fermes

8. **Prix moyen par ferme** (Requête #11)
   - Type : Bar chart
   - Titre : "Prix Moyen par Ferme"
   - Top 15 fermes

#### Lignes 3-4 : Performance détaillée
9. **Évolution CA par ferme** (Requête #9 adaptée)
    - Type : Line chart
    - Titre : "Évolution CA Top 5 Fermes"
    - Période : 90 jours

10. **Répartition catégories par ferme** (Requête #14)
    - Type : Stacked bar
    - Titre : "Catégories par Ferme"
    - Top 10 fermes

11. **Fermes avec stock critique** (Requête #15)
    - Type : Table
    - Titre : "Alertes Stock Critique"
    - Colonnes : Ferme, Produit, Dernière MAJ

12. **Nouvelles fermes par mois** (Requête #7 adaptée)
    - Type : Bar chart
    - Titre : "Nouvelles Fermes"
    - Période : 12 mois

---

## 🥕 DASHBOARD 3 : ANALYSE PRODUITS

### Objectif
Comprendre la performance des produits et optimiser l'offre.

### Layout recommandé : 4x4 (16 widgets)

#### Ligne 1 : Top Produits
1. **Produits les plus vendus** (Requête #13)
   - Type : Table
   - Titre : "Top 20 Produits Vendus"
   - Colonnes : Produit, Catégorie, Ferme, Quantité, CA

2. **Nombre total de produits** (Requête #14)
   - Type : Number
   - Titre : "Produits Actifs"
   - Détail : Disponibles

3. **Produits en rupture de stock** (Requête #15)
   - Type : Number
   - Titre : "Produits en Rupture"
   - Alert : Si > 10

4. **Catégories les plus populaires** (Requête #14)
   - Type : Pie chart
   - Titre : "Produits par Catégorie"

#### Ligne 2 : Prix et Stocks
5. **Distribution prix produits** (Requête #14)
   - Type : Histogram
   - Titre : "Distribution Prix"
   - Tranches : <1000, 1000-5000, 5000-10000, 10000+

6. **Stock total par catégorie** (Requête #14)
   - Type : Bar chart
   - Titre : "Stock par Catégorie"

7. **Prix moyen par catégorie** (Requête #14)
   - Type : Bar chart
   - Titre : "Prix Moyen par Catégorie"

8. **Produits saisonniers** (Requête #16)
   - Type : Table
   - Titre : "Produits par Saison"
   - Colonnes : Catégorie, Été, Hiver

#### Lignes 3-4 : Performance détaillée
9. **Évolution ventes par catégorie** (Requête #13 adaptée)
    - Type : Line chart
    - Titre : "Ventes par Catégorie"
    - Période : 90 jours

10. **Produits les plus rentables** (Requête #13)
    - Type : Table
    - Titre : "Meilleure Rentabilité"
    - Colonnes : Produit, Marge, CA

11. **Alertes stock bas** (Requête #15 adaptée)
    - Type : Table
    - Titre : "Stock Bas (<10 unités)"
    - Colonnes : Produit, Ferme, Stock actuel

12. **Analyse saisonnalité** (Requête #16)
    - Type : Heatmap
    - Titre : "Saisonalité Produits"
    - Axes : Catégories vs Mois

---

## ⚙️ DASHBOARD 4 : OPÉRATIONS TECHNIQUES

### Objectif
Surveiller les performances techniques et l'expérience utilisateur.

### Layout recommandé : 4x4 (16 widgets)

#### Ligne 1 : Performance Système
1. **Temps réponse API** (Métriques Prometheus)
   - Type : Line chart
   - Titre : "Temps de Réponse API"
   - Source : Prometheus
   - Période : 24 heures

2. **Taux d'erreur API** (Métriques Prometheus)
   - Type : Gauge
   - Titre : "Taux d'Erreur API"
   - Seuils : <1% (vert), 1-5% (orange), >5% (rouge)

3. **Utilisation stockage MinIO** (Métriques MinIO)
   - Type : Progress bar
   - Titre : "Espace Stockage"
   - Total vs Utilisé

4. **Logs d'erreurs** (Source Loki)
   - Type : Number
   - Titre : "Erreurs 24h"
   - Trend : vs 24h précédentes

#### Ligne 2 : Paiements et Conversions
5. **Taux échec paiements** (Requête #18)
   - Type : Line chart
   - Titre : "Taux Échec Paiements"
   - Période : 30 jours

6. **Répartition méthodes paiement** (Requête #3)
   - Type : Donut chart
   - Titre : "Méthodes Paiement"
   - Période : 7 jours

7. **Paniers abandonnés** (Requête #23)
   - Type : Bar chart
   - Titre : "Paniers Abandonnés par Valeur"
   - Tranches de montant

8. **Temps moyen traitement commandes** (Requête #24)
   - Type : Line chart
   - Titre : "Temps Traitement Commandes"
   - Période : 30 jours

#### Lignes 3-4 : Recherche et Utilisateurs
9. **Performance recherches** (Requête #22)
    - Type : Line chart
    - Titre : "Temps Réponse Recherches"
    - Période : 7 jours

10. **Termes recherche populaires** (Requête #21)
    - Type : Word cloud ou Table
    - Titre : "Top Recherches"
    - Période : 7 jours

11. **Utilisation filtres recherche** (Requête #25)
    - Type : Bar chart
    - Titre : "Filtres Plus Utilisés"
    - Période : 30 jours

12. **Taux conversion recherche** (Requête #21 adaptée)
    - Type : Funnel
    - Titre : "Conversion Recherche → Achat"
    - Étapes : Recherche → Vue produit → Ajout panier → Commande

---

## 🎨 CONFIGURATION VISUELLE

### Thème et Couleurs
- **Couleur primaire** : #2E7D32 (vert agriculture)
- **Couleur secondaire** : #FF6F00 (orange)
- **Couleur accent** : #1976D2 (bleu)
- **Background** : Blanc avec bordures grises

### Polices et Tailles
- **Titres** : Roboto, 16-20px, gras
- **Sous-titres** : Roboto, 12-14px, normal
- **Nombres** : Roboto Mono, 14-18px

### Icônes et Symboles
- **CA** : 💰 ou 📈
- **Utilisateurs** : 👥 ou 🧑‍🌾
- **Commandes** : 📦 ou 🛒
- **Produits** : 🥕 ou 🌾
- **Performance** : ⚡ ou 📊

---

## 📱 FILTRES ET INTERACTIVITÉ

### Filtres globaux (appliqués à tous les widgets)
1. **Période temporelle**
   - Aujourd'hui
   - 7 derniers jours
   - 30 derniers jours
   - 90 derniers jours
   - Personnalisé

2. **Région géographique**
   - Toutes
   - Centre
   - Ouest
   - Est
   - Sud

3. **Type de ferme**
   - Toutes
   - Certifiées bio
   - Conventionnelles

### Filtres par dashboard
- **Dashboard Fermes** : Sélection de ferme spécifique
- **Dashboard Produits** : Catégorie de produit
- **Dashboard Opérations** : Type d'erreur

---

## 🔔 ALERTES ET NOTIFICATIONS

### Seuils critiques
1. **CA journalier < 80% moyenne** : Email immédiat
2. **Taux échec paiement > 5%** : Slack + Email
3. **Stock critique < 10 produits** : Email quotidien
4. **Temps réponse API > 2s** : Slack immédiat

### Fréquences de rafraîchissement
- **KPIs temps réel** : 5 minutes
- **Tendances journalières** : 1 heure
- **Analyses mensuelles** : 24 heures

---

## 🚀 DÉPLOIEMENT

### Étapes de déploiement
1. **Créer les dashboards** un par un
2. **Importer les requêtes** depuis metabase-queries.md
3. **Configurer les filtres** globaux
4. **Tester les interactions** entre widgets
5. **Configurer les alertes** avec les bons seuils
6. **Partager avec l'équipe** selon les rôles

### Permissions d'accès
- **Admin** : Tous les dashboards, édition complète
- **Manager** : Dashboards business, édition limitée
- **Analyste** : Vue seule, exports autorisés
- **Ferme** : Dashboard fermes uniquement (ses données)

---

_**Note** : Ce guide est basé sur les requêtes MongoDB optimisées. Adaptez les visuels selon vos préférences et les besoins spécifiques de votre équipe._
