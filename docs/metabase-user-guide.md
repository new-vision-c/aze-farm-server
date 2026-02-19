# =====================================================================================================
# GUIDE UTILISATEUR METABASE - AZE FARM SERVER
# =====================================================================================================
# Guide complet pour l'utilisation quotidienne de Metabase
# Destiné aux équipes business, techniques et management
# =====================================================================================================

## 📋 TABLE DES MATIÈRES

1. [Premiers Pas](#premiers-pas)
2. [Navigation dans l'Interface](#navigation-dans-linterface)
3. [Utilisation des Dashboards](#utilisation-des-dashboards)
4. [Création de Rapports Personnalisés](#création-de-rapports-personnalisés)
5. [Export et Partage](#export-et-partage)
6. [Bonnes Pratiques](#bonnes-pratiques)
7. [Dépannage Commun](#dépannage-commun)

---

## 🚀 PREMIERS PAS

### Accès à Metabase
1. **URL** : http://localhost:3002
2. **Identifiants** :
   - Email : admin@azefarm.com
   - Password : [configuré dans .env]

### Premier connexion
1. Changer le mot de passe admin par défaut
2. Configurer votre profil (nom, photo, timezone)
3. Explorer l'interface et les dashboards disponibles

### Vue d'ensemble de l'interface
```
┌─────────────────────────────────────────────────────────┐
│  🏠 Aze Farm Analytics    👤 Admin    ⚙️ Settings    │
├─────────────────────────────────────────────────────────┤
│  📊 Dashboards    🔍 Questions    📈 Collections     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│           [Zone principale des dashboards]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🧭 NAVIGATION DANS L'INTERFACE

### Menu principal

#### 📊 Dashboards
- **Vue Générale Business** : KPIs globaux de l'entreprise
- **Performance Fermes** : Analyse détaillée des fermes
- **Analyse Produits** : Performance des produits et catégories
- **Opérations Techniques** : Monitoring système et technique

#### 🔍 Questions (Requêtes)
- **Nouvelle Question** : Créer vos propres requêtes
- **Mes Questions** : Vos requêtes sauvegardées
- **Questions Partagées** : Requêtes de l'équipe

#### 📈 Collections
- **Aze Farm MongoDB** : Source de données principale
- **Tables** : users, farms, products, orders, etc.

#### ⚙️ Settings
- **Admin** : Gestion utilisateurs et permissions
- **Data** : Gestion des sources de données
- **Alerts** : Configuration des notifications

### Filtres globaux
En haut de chaque dashboard, vous trouverez des filtres :

#### 📅 Période temporelle
- **Aujourd'hui** : Données du jour
- **7 derniers jours** : Semaine en cours
- **30 derniers jours** : Mois en cours
- **90 derniers jours** : Trimestre
- **Personnalisé** : Plage de dates spécifique

#### 🗺️ Région géographique
- **Toutes** : Toutes les régions
- **Centre** : Yaoundé et environs
- **Ouest** : Bamenda, Bafoussam
- **Est** : Bertoua, Garoua
- **Sud** : Douala, Kribi

---

## 📊 UTILISATION DES DASHBOARDS

### Dashboard Vue Générale Business

#### KPIs principaux (Ligne 1)
1. **CA Mensuel** : Chiffre d'affaires du mois en cours
   - Cliquez pour voir le détail par jour
   - Survolez pour voir la variation vs mois précédent

2. **Utilisateurs Totals** : Répartition CONSUMER vs FARMER
   - Cliquez pour voir la liste des utilisateurs
   - Filtrez par rôle et statut

3. **Commandes Mensuelles** : Nombre total de commandes
   - Cliquez pour voir le détail par statut
   - Comparez avec le mois précédent

4. **Panier Moyen** : Valeur moyenne par commande
   - Évolution sur 30 jours
   - Comparaison par catégorie de produits

#### Tendances (Ligne 2)
5. **CA Journalier** : Évolution du chiffre d'affaires
   - Zoom sur une période spécifique
   - Export des données en CSV/Excel

6. **Utilisateurs Actifs** : Connexions quotidiennes
   - Distinction CONSUMER/FARMER
   - Tendance d'engagement

7. **Méthodes Paiement** : Répartition des paiements
   - Orange Money, MTN Money, Wave, Moov Money
   - Évolution sur 30 jours

8. **Taux Conversion** : Panier → Commande
   - Indicateur vert/orange/rouge
   - Objectif : >10%

### Dashboard Performance Fermes

#### Top Fermes (Ligne 1)
1. **Top Fermes par CA** : Classement des meilleures fermes
   - Cliquez sur une ferme pour voir le détail
   - Filtres par région et catégorie

2. **Meilleures Notes** : Fermes les mieux notées
   - Nombre d'avis et note moyenne
   - Filtre par nombre minimum d'avis

3. **Fermes Actives** : Nombre total de fermes opérationnelles
   - Évolution mensuelle
   - Taux d'activation

4. **Note Moyenne** : Note globale de la plateforme
   - Évolution sur 12 mois
   - Comparaison par région

#### Analyses détaillées (Lignes 3-4)
- **Répartition Géographique** : Carte des fermes par région
- **Produits par Ferme** : Diversification de l'offre
- **Stock Total** : Disponibilité des produits
- **Évolution CA** : Performance temporelle

### Dashboard Analyse Produits

#### Top Produits (Ligne 1)
1. **Produits Plus Vendus** : Classement des ventes
   - Détail par ferme et catégorie
   - Quantité et chiffre d'affaires

2. **Produits Actifs** : Nombre total disponible
   - Taux de disponibilité
   - Évolution mensuelle

3. **Ruptures de Stock** : Alertes produits indisponibles
   - Liste détaillée avec fermes concernées
   - Délai de réapprovisionnement

4. **Catégories Populaires** : Répartition par type
   - Légumes, fruits, céréales, etc.
   - Tendance saisonnière

### Dashboard Opérations Techniques

#### Performance Système (Ligne 1)
1. **Temps Réponse API** : Performance technique
   - Graphique en temps réel
   - Alertes si >2 secondes

2. **Taux Erreur API** : Stabilité du système
   - Pourcentage d'erreurs
   - Types d'erreurs les plus fréquentes

3. **Espace Stockage** : Utilisation MinIO
   - Espace utilisé vs disponible
   - Tendance de croissance

4. **Erreurs 24h** : Nombre d'incidents
   - Comparaison avec 24h précédentes
   - Sévérité des erreurs

---

## 📝 CRÉATION DE RAPPORTS PERSONNALISÉS

### Créer une nouvelle question

#### Étape 1 : Choisir la source de données
1. Cliquez sur **"+ Nouvelle Question"**
2. Sélectionnez **"Aze Farm MongoDB"**
3. Choisissez la table principale (ex: orders)

#### Étape 2 : Construire la requête
**Interface visuelle** :
- **Données** : Glissez-déposez les champs
- **Filtres** : Ajoutez des conditions
- **Regroupements** : Agrégez les données
- **Calculs** : Créez des métriques personnalisées

**Mode SQL** :
- Cliquez sur **"Éditeur SQL"**
- Écrivez votre requête MongoDB SQL
- Utilisez les requêtes prédéfinies comme modèle

#### Étape 3 : Personnaliser l'affichage
- **Type de visualisation** : Tableau, graphique, jauge, etc.
- **Axes X/Y** : Choisissez les dimensions
- **Couleurs et styles** : Personnalisez l'apparence
- **Titres et descriptions** : Ajoutez du contexte

#### Exemple : CA par ferme ce mois-ci
```sql
SELECT 
  f.name as farm_name,
  SUM(o.totalAmount) as revenue,
  COUNT(o._id) as order_count
FROM farms f
JOIN orders o ON f._id = o.farmId
WHERE o.status != 'CANCELLED' 
AND o.orderDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY f._id, f.name
ORDER BY revenue DESC
```

### Sauvegarder et partager
1. **Nommez votre question** : Ex: "CA Fermes Mensuel"
2. **Description** : Détail de ce que la requête montre
3. **Partage** : Choisissez qui peut voir/modifier
4. **Ajouter à un dashboard** : Intégrez à un dashboard existant

---

## 📤 EXPORT ET PARTAGE

### Exporter des données
#### Depuis un widget
1. Cliquez sur les **"..."** en haut à droite du widget
2. Choisissez **"Exporter"**
3. Formats disponibles :
   - **CSV** : Pour Excel/Google Sheets
   - **Excel** : Format natif avec mise en forme
   - **JSON** : Pour intégrations techniques
   - **PDF** : Rapport statique avec graphiques

#### Depuis un dashboard complet
1. Cliquez sur **"Partager"** en haut du dashboard
2. **"Exporter comme PDF"** : Génére un rapport complet
3. **"Exporter les données"** : CSV avec tous les widgets

### Partager des dashboards
#### Lien public
1. **"Partager"** → **"Créer un lien public"**
2. Configurez les permissions :
   - **Vue seule** : Consultation sans modification
   - **Accès restreint** : Mot de passe requis
   - **Limitation temporelle** : Expiration du lien

#### Intégration iframe
```html
<iframe 
  src="http://localhost:3002/public/dashboard/xyz123"
  width="100%" 
  height="600"
  frameborder="0">
</iframe>
```

#### Abonnements email
1. **"Partager"** → **"Programmer un email"**
2. Configurez :
   - **Fréquence** : Quotidien, hebdomadaire, mensuel
   - **Destinataires** : Liste des emails
   - **Format** : PDF ou lien vers dashboard
   - **Filtres** : Période et données spécifiques

---

## 💡 BONNES PRATIQUES

### Performance des requêtes
#### Optimisation SQL
- **Indexez les champs filtrés** : created_at, status, etc.
- **Limitez les périodes** : Évitez les requêtes sur toute l'historique
- **Utilisez des agrégations** : SUM, COUNT, AVG au niveau base de données
- **Évitez les SELECT *** : Sélectionnez uniquement les champs nécessaires

#### Bonnes pratiques Metabase
- **Utilisez des variables** : Pour les filtres récurrents
- **Créez des modèles** : Questions réutilisables
- **Documentez vos questions** : Descriptions claires
- **Testez les performances** : Vérifiez le temps d'exécution

### Gestion des données
#### Fraîcheur des données
- **Mises à jour en temps réel** : Pour les KPIs critiques
- **Actualisation quotidienne** : Pour les rapports de tendance
- **Vérification régulière** : Confirmez l'intégrité des données

#### Qualité des données
- **Validation des entrées** : Vérifiez la cohérence
- **Nettoyage régulier** : Supprimez les données corrompues
- **Documentation** : Maintenez un dictionnaire de données

### Collaboration
#### Permissions
- **Lecture seule** : Pour la plupart des utilisateurs
- **Édition limitée** : Pour les analystes
- **Admin complet** : Pour l'équipe technique

#### Versioning
- **Questions templates** : Modèles réutilisables
- **Dashboards de référence** : Versions officielles
- **Documentation des changements** : Suivi des modifications

---

## 🔧 DÉPANNAGE COMMUN

### Problèmes de connexion
#### "Impossible de se connecter à Metabase"
- **Vérifiez l'URL** : http://localhost:3002
- **Testez le réseau** : Ping localhost:3002
- **Redémarrez Metabase** : `docker-compose restart metabase`

#### "Mot de passe oublié"
- Contactez l'administrateur système
- Réinitialisation via la base de données Metabase

### Problèmes de données
#### "Aucune donnée affichée"
- **Vérifiez la connexion MongoDB** : Testez la source de données
- **Confirmez les filtres** : Période et autres critères
- **Vérifiez les permissions** : Accès aux collections

#### "Requête trop lente"
- **Optimisez la requête** : Ajoutez des index
- **Réduisez la période** : Limitez l'historique
- **Utilisez des agrégations** : Pré-traitez les données

### Problèmes d'affichage
#### "Graphique ne s'affiche pas"
- **Vérifiez le type de visualisation** : Choisissez le bon format
- **Confirmez les données** : Assurez-vous d'avoir des valeurs
- **Testez un autre format** : Tableau pour vérifier

#### "Filtres ne fonctionnent pas"
- **Vérifiez la syntaxe** : Format des dates et nombres
- **Confirmez les champs** : Noms exacts des colonnes
- **Testez manuellement** : Requête SQL sans filtre

### Performance système
#### "Metabase lent"
- **Vérifiez les ressources** : CPU et mémoire
- **Optimisez les requêtes** : Réduisez la complexité
- **Augmentez les ressources** : Si nécessaire

#### "Alertes non reçues"
- **Vérifiez la configuration** : SMTP/Slack/Webhook
- **Testez les canaux** : Envoyez un message test
- **Confirmez les seuils** : Vérifiez les conditions

---

## 📞 SUPPORT ET RESSOURCES

### Documentation interne
- **Guide connexion MongoDB** : `docs/metabase-mongodb-connection.md`
- **Requêtes prédéfinies** : `docs/metabase-queries.md`
- **Configuration dashboards** : `docs/metabase-dashboards-guide.md`
- **Configuration alertes** : `docs/metabase-alerts.md`

### Scripts utiles
- **Démarrage Metabase** : `./scripts/start-metabase.sh`
- **Validation MongoDB** : `./scripts/validate-metabase-mongodb.sh`
- **Création dashboards** : `./scripts/create-metabase-dashboards.sh`

### Contacts support
- **Support technique** : tech@azefarm.com
- **Support business** : business@azefarm.com
- **Urgences** : +237 XXX XXX XXX

### Ressources externes
- **Documentation Metabase** : https://www.metabase.com/docs/latest/
- **Communauté Metabase** : https://www.metabase.com/help/
- **MongoDB Atlas** : https://www.mongodb.com/docs/atlas/

---

_**Dernière mise à jour** : 18 février 2026_  
_**Version** : 1.0_  
_**Auteur** : Équipe Aze Farm_
