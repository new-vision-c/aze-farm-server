# =====================================================================================================
# CONFIGURATION DES ALERTES METABASE
# =====================================================================================================
# Configuration détaillée des alertes pour les KPIs critiques d'Aze Farm
# Seuils, canaux de notification et fréquences
# =====================================================================================================

## 📋 PRÉREQUIS

1. **Metabase dashboards créés** : Étape 3 complétée
2. **Accès admin Metabase** : Pour configurer les alertes
3. **Canaux de notification** : Email, Slack, Webhook configurés

---

## 🚨 ALERTES CRITIQUES (Notification Immédiate)

### 1. Chiffre d'affaires journalier bas
**Objectif** : Détecter rapidement une baisse anormale des ventes

**Configuration** :
- **Dashboard** : Vue Générale Business
- **Widget** : CA Journalier (Requête #1)
- **Condition** : `revenue_today < (revenue_avg_7d * 0.8)`
- **Seuil** : CA < 80% de la moyenne des 7 derniers jours
- **Fréquence** : Vérification toutes les heures
- **Notification** : Email + Slack immédiat

**Message d'alerte** :
```
🚨 ALERTE CA BAS - Aze Farm
Chiffre d'affaires du jour : {value} XOF
Moyenne 7 jours : {avg_value} XOF
Variation : {variation}%
Action requise : Vérifier les ventes et l'état du système
```

### 2. Taux d'échec des paiements élevé
**Objectif** : Détecter les problèmes avec les opérateurs de paiement

**Configuration** :
- **Dashboard** : Opérations Techniques
- **Widget** : Taux Échec Paiements (Requête #18)
- **Condition** : `failure_rate > 5`
- **Seuil** : Taux d'échec > 5%
- **Fréquence** : Vérification toutes les 30 minutes
- **Notification** : Slack + Email immédiat

**Message d'alerte** :
```
💳 ALERTE PAIEMENTS - Aze Farm
Taux d'échec : {failure_rate}%
Seuil dépassé : 5%
Vérifier : Connexion opérateurs (Orange, MTN, Wave)
Impact : {affected_orders} commandes affectées
```

### 3. Stock critique sur les produits
**Objectif** : Éviter les ruptures de stock sur les produits populaires

**Configuration** :
- **Dashboard** : Analyse Produits
- **Widget** : Produits en Rupture (Requête #15)
- **Condition** : `out_of_stock_count > 10`
- **Seuil** : Plus de 10 produits en rupture
- **Fréquence** : Vérification 2x par jour
- **Notification** : Email aux fermes + Slack

**Message d'alerte** :
```
🥕 ALERTE STOCK - Aze Farm
Produits en rupture : {count}
Produits concernés : {product_list}
Fermes impactées : {farm_count}
Action : Réapprovisionnement urgent requis
```

### 4. Temps de réponse API lent
**Objectif** : Surveiller les performances techniques de la plateforme

**Configuration** :
- **Dashboard** : Opérations Techniques
- **Widget** : Temps Réponse API (Prometheus)
- **Condition** : `response_time_p95 > 2000`
- **Seuil** : Temps réponse > 2 secondes
- **Fréquence** : Vérification toutes les 5 minutes
- **Notification** : Slack équipe technique

**Message d'alerte** :
```
⚡ ALERTE PERFORMANCE - Aze Farm
Temps réponse API : {response_time}ms
Seuil : 2000ms
Impact : Expérience utilisateur dégradée
Action : Vérifier charge serveur et base de données
```

---

## ⚠️ ALERTES AVERTISSEMENT (Notification Quotidienne)

### 5. Faible acquisition d'utilisateurs
**Objectif** : Surveiller la croissance de la base utilisateur

**Configuration** :
- **Dashboard** : Vue Générale Business
- **Widget** : Nouveaux Utilisateurs (Requête #7)
- **Condition** : `new_users_daily < 5`
- **Seuil** : Moins de 5 nouveaux utilisateurs par jour
- **Fréquence** : Vérification quotidienne à 18h
- **Notification** : Email marketing

**Message d'alerte** :
```
👥 INFO UTILISATEURS - Aze Farm
Nouveaux utilisateurs : {count}
Objectif quotidien : 5+
Tendance : {trend}
Action : Lancer campagne acquisition si nécessaire
```

### 6. Taux de conversion paniers bas
**Objectif** : Optimiser le tunnel de conversion

**Configuration** :
- **Dashboard** : Vue Générale Business
- **Widget** : Taux Conversion (Requête #4)
- **Condition** : `conversion_rate < 2`
- **Seuil** : Taux conversion < 2%
- **Fréquence** : Vérification quotidienne
- **Notification** : Email produit

**Message d'alerte** :
```
🛒 INFO CONVERSION - Aze Farm
Taux conversion : {rate}%
Objectif : 2%+
Paniers abandonnés : {abandoned_count}
Action : Analyser tunnel et optimiser UX
```

### 7. Produits non mis à jour
**Objectif** : Maintenir la fraîcheur des informations produits

**Configuration** :
- **Dashboard** : Analyse Produits
- **Widget** : Produits Anciens (Requête #15 adaptée)
- **Condition** : `days_since_update > 30`
- **Seuil** : Produits non mis à jour depuis 30+ jours
- **Fréquence** : Vérification hebdomadaire
- **Notification** : Email fermes

**Message d'alerte** :
```
📦 INFO PRODUITS - Aze Farm
Produits à mettre à jour : {count}
Dernière mise à jour : >30 jours
Impact : Qualité informations
Action : Contacter les fermes pour mise à jour
```

---

## 📊 CONFIGURATION TECHNIQUE

### Canaux de notification

#### Email
```yaml
email:
  smtp_host: ${SMTP_HOST}
  smtp_port: ${SMTP_PORT}
  from_address: ${METABASE_EMAIL_FROM}
  recipients:
    critical: ["admin@azefarm.com", "tech@azefarm.com"]
    business: ["business@azefarm.com"]
    marketing: ["marketing@azefarm.com"]
```

#### Slack
```yaml
slack:
  webhook_url: ${SLACK_WEBHOOK_URL}
  channels:
    critical: "#alerts-critical"
    business: "#business-alerts"
    tech: "#tech-alerts"
  mention_users: ["@admin", "@tech-lead"]
```

#### Webhook (pour intégrations externes)
```yaml
webhook:
  url: ${WEBHOOK_ALERT_URL}
  headers:
    Authorization: "Bearer ${WEBHOOK_TOKEN}"
    Content-Type: "application/json"
```

### Fréquences de vérification

| Type d'alerte | Fréquence | Période de référence |
|---------------|------------|---------------------|
| CA bas | Toutes les heures | Dernières 24h |
| Échec paiements | Toutes les 30 min | Dernières 2h |
| Stock critique | 2x par jour | Dernière 24h |
| Performance API | Toutes les 5 min | Dernière 15 min |
| Utilisateurs | Quotidien | Dernières 24h |
| Conversion | Quotidien | Dernières 24h |
| Mise à jour produits | Hebdomadaire | Derniers 30 jours |

### Escalade des alertes

#### Niveau 1 : Avertissement
- **Destinataires** : Équipe concernée uniquement
- **Délai** : Immédiat pour critiques, quotidien pour warnings
- **Action** : Investigation et résolution

#### Niveau 2 : Critique
- **Destinataires** : Toutes les équipes + management
- **Délai** : Immédiat
- **Action** : Intervention prioritaire + communication

#### Niveau 3 : Urgence
- **Destinataires** : Tous + stakeholders externes si nécessaire
- **Délai** : Immédiat + rappel toutes les 30 min
- **Action** : Incident response plan

---

## 🔧 IMPLÉMENTATION DANS METABASE

### Étape 1 : Configuration des canaux
1. **Settings** → **Authentication** → **Email**
2. Configurer SMTP avec variables d'environnement
3. **Settings** → **Slack** → **Add Slack integration**
4. Configurer webhook avec URL Slack

### Étape 2 : Création des alertes
Pour chaque widget de dashboard :
1. Clic sur le widget → **"..."** → **"Set up an alert"**
2. Configurer la condition et le seuil
3. Choisir le canal de notification
4. Définir la fréquence de vérification
5. Personnaliser le message d'alerte

### Étape 3 : Test des alertes
1. **Test email** : Envoyer alerte test
2. **Test Slack** : Vérifier réception webhook
3. **Test conditions** : Simuler données pour déclencher
4. **Validation** : Confirmer format et contenu

---

## 📈 MÉTRIQUES DES ALERTES

### Indicateurs à surveiller
- **Taux de faux positifs** : < 5%
- **Temps de résolution** : < 2h pour critiques
- **Nombre d'alertes/jour** : < 10
- **Taux de résolution** : > 95%

### Rapport mensuel
```yaml
monthly_report:
  alerts_triggered: 45
  false_positives: 2 (4.4%)
  avg_resolution_time: 1.5h
  critical_alerts: 8
  business_impact: "Évité perte de 2.5M XOF"
```

---

## 🎯 BONNES PRATIQUES

### Messages d'alerte
- **Clairs et concis** : Aller droit au but
- **Contexte** : Inclure valeur actuelle et seuil
- **Action** : Indiquer quoi faire
- **Impact** : Expliquer conséquences
- **Formatage** : Utiliser emojis et markdown

### Gestion des faux positifs
- **Ajuster les seuils** : Régulièrement selon les patterns
- **Périodes de maintenance** : Désactiver temporairement
- **Conditions complexes** : Combiner plusieurs métriques
- **Validation manuelle** : Pour alertes critiques

### Documentation
- **Registry des alertes** : Documenter chaque alerte
- **Playbooks** : Procédures de résolution
- **Contact lists** : Qui contacter pour quel type d'alerte
- **Review trimestriel** : Optimiser et nettoyer

---

## 🔄 MAINTENANCE

### Mensuel
- Review des performances des alertes
- Ajustement des seuils saisonniers
- Mise à jour des listes de contacts
- Nettoyage des alertes obsolètes

### Trimestriel
- Audit complet du système d'alertes
- Simulation de scénarios de crise
- Formation des équipes aux procédures
- Mise à jour des playbooks

---

_**Note** : Cette configuration doit être adaptée selon les volumes réels et les besoins spécifiques de l'équipe Aze Farm._
