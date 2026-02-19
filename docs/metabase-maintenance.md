# =====================================================================================================
# PROCÉDURES DE MAINTENANCE METABASE
# =====================================================================================================
# Guide complet pour la maintenance, les mises à jour et la gestion des incidents
# Assurer la continuité de service et la performance de Metabase
# =====================================================================================================

## 📋 TABLE DES MATIÈRES

1. [Maintenance Quotidienne](#maintenance-quotidienne)
2. [Maintenance Hebdomadaire](#maintenance-hebdomadaire)
3. [Maintenance Mensuelle](#maintenance-mensuelle)
4. [Gestion des Sauvegardes](#gestion-des-sauvegardes)
5. [Mises à Jour](#mises-à-jour)
6. [Gestion des Incidents](#gestion-des-incidents)
7. [Performance et Optimisation](#performance-et-optimisation)

---

## 📅 MAINTENANCE QUOTIDIENNE

### Vérifications automatiques (Scripts)

#### 1. Script de santé quotidien
```bash
#!/bin/bash
# daily-health-check.sh

echo "=== Vérification santé Metabase - $(date) ==="

# Vérifier que Metabase est en cours d'exécution
if ! docker ps | grep -q "metabase_bi"; then
    echo "❌ Metabase n'est pas en cours d'exécution"
    # Redémarrage automatique
    docker-compose -f docker-compose.metabase.yml restart metabase
    echo "🔄 Redémarrage de Metabase effectué"
else
    echo "✅ Metabase est en cours d'exécution"
fi

# Vérifier l'espace disque
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "⚠️ Espace disque critique: ${DISK_USAGE}%"
    # Envoyer alerte
    curl -X POST "$SLACK_WEBHOOK_URL" -d '{"text":"⚠️ Espace disque critique sur Metabase: ${DISK_USAGE}%"}'
else
    echo "✅ Espace disque OK: ${DISK_USAGE}%"
fi

# Vérifier la mémoire
MEMORY_USAGE=$(docker stats --no-stream metabase_bi | awk 'NR==2 {print $4}' | sed 's/%//')
if [ $MEMORY_USAGE -gt 85 ]; then
    echo "⚠️ Mémoire élevée: ${MEMORY_USAGE}%"
else
    echo "✅ Mémoire OK: ${MEMORY_USAGE}%"
fi

# Vérifier la connexion MongoDB
if docker exec mongo_db mongosh --eval "db.adminCommand('ismaster')" > /dev/null 2>&1; then
    echo "✅ MongoDB accessible"
else
    echo "❌ MongoDB inaccessible"
fi

echo "=== Fin vérification ==="
```

#### 2. Nettoyage des logs
```bash
#!/bin/bash
# cleanup-logs.sh

# Nettoyer les logs Metabase plus anciens que 7 jours
find /var/log/metabase -name "*.log" -mtime +7 -delete

# Nettoyer les logs Docker plus anciens que 3 jours
docker system prune -f --filter "until=72h"

echo "Nettoyage des logs effectué"
```

### Surveillance manuelle

#### KPIs à vérifier quotidiennement
1. **État des services** : Metabase, MongoDB, PostgreSQL
2. **Performance des requêtes** : Temps de réponse < 5 secondes
3. **Espace disque** : < 80% d'utilisation
4. **Mémoire** : < 85% d'utilisation
5. **Alertes** : Vérifier les alertes déclenchées

#### Actions si problème détecté
- **Service arrêté** : Redémarrer avec `docker-compose restart`
- **Performance dégradée** : Vérifier les requêtes lentes
- **Espace insuffisant** : Nettoyer les logs et anciennes données

---

## 📆 MAINTENANCE HEBDOMADAIRE

### Tâches automatisées

#### 1. Sauvegarde complète
```bash
#!/bin/bash
# weekly-backup.sh

BACKUP_DIR="/backups/metabase/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# Sauvegarder la base PostgreSQL Metabase
docker exec postgres_metabase pg_dump -U metabase metabase > "$BACKUP_DIR/metabase_db.sql"

# Sauvegarder les données Metabase (configurations, dashboards)
docker cp metabase_bi:/metabase-data "$BACKUP_DIR/metabase-data"

# Sauvegarder la configuration
cp docker-compose.metabase.yml "$BACKUP_DIR/"
cp .env "$BACKUP_DIR/"

# Compresser la sauvegarde
tar -czf "$BACKUP_DIR.tar.gz" -C "$(dirname "$BACKUP_DIR")" "$(basename "$BACKUP_DIR")"
rm -rf "$BACKUP_DIR"

echo "Sauvegarde hebdomadaire effectuée: $BACKUP_DIR.tar.gz"
```

#### 2. Mise à jour des dashboards
```bash
#!/bin/bash
# update-dashboards.sh

# Rafraîchir les dashboards Metabase
curl -X POST "$METABASE_URL/api/database/1/sync" \
  -H "Authorization: Bearer $METABASE_TOKEN"

# Vérifier l'intégrité des requêtes
./scripts/validate-metabase-mongodb.sh

echo "Mise à jour des dashboards effectuée"
```

### Vérifications manuelles hebdomadaires

#### 1. Analyse des performances
- **Requêtes lentes** : Identifier et optimiser
- **Index MongoDB** : Vérifier l'utilisation
- **Cache Metabase** : Vider si nécessaire

#### 2. Gestion des utilisateurs
- **Nouveaux utilisateurs** : Vérifier les permissions
- **Comptes inactifs** : Désactiver si nécessaire
- **Rôles et accès** : Réviser périodiquement

#### 3. Qualité des données
- **Données aberrantes** : Identifier et corriger
- **Mises à jour manquantes** : Vérifier la fraîcheur
- **Doublons** : Nettoyer si détectés

---

## 🗓️ MAINTENANCE MENSUELLE

### Tâches approfondies

#### 1. Audit de sécurité
```bash
#!/bin/bash
# security-audit.sh

echo "=== Audit de sécurité Metabase - $(date) ==="

# Vérifier les permissions des fichiers
find /home/xenos-mh/backdev/nvc-projet/aze-farm-server-1 -name "*.yml" -o -name "*.env*" | xargs ls -la

# Vérifier les mots de passe par défaut
if grep -q "admin\|password\|secret" .env; then
    echo "⚠️ Mots de passe par défaut détectés dans .env"
fi

# Vérifier les accès réseau
netstat -tlnp | grep -E ":(3002|5432|27017)"

# Analyser les logs d'accès
grep "ERROR\|WARNING\|UNAUTHORIZED" /var/log/metabase/metabase.log | tail -20

echo "=== Fin audit sécurité ==="
```

#### 2. Optimisation des performances
```bash
#!/bin/bash
# performance-optimization.sh

# Optimiser PostgreSQL Metabase
docker exec postgres_metabase psql -U metabase -d metabase -c "VACUUM ANALYZE;"

# Optimiser MongoDB
docker exec mongo_db mongosh --eval "db.runCommand({compact: 'users'})"
docker exec mongo_db mongosh --eval "db.runCommand({compact: 'orders'})"

# Redémarrer les services pour libérer la mémoire
docker-compose -f docker-compose.metabase.yml restart

echo "Optimisation des performances effectuée"
```

#### 3. Nettoyage des données
- **Anciennes alertes** : Archiver après 90 jours
- **Logs d'audit** : Archiver après 6 mois
- **Sessions expirées** : Nettoyer automatiquement
- **Cache obsolète** : Vider périodiquement

### Rapport mensuel
```bash
#!/bin/bash
# monthly-report.sh

REPORT_FILE="/reports/metabase-$(date +%Y-%m).md"

cat > "$REPORT_FILE" << EOF
# Rapport Mensuel Metabase - $(date +%B %Y)

## Statistiques d'utilisation
- Utilisateurs actifs : $(curl -s "$METABASE_URL/api/user" -H "Authorization: Bearer $METABASE_TOKEN" | jq '.data | length')
- Dashboards créés : $(curl -s "$METABASE_URL/api/dashboard" -H "Authorization: Bearer $METABASE_TOKEN" | jq '.data | length')
- Questions créées : $(curl -s "$METABASE_URL/api/card" -H "Authorization: Bearer $METABASE_TOKEN" | jq '.data | length')

## Performance
- Temps de réponse moyen : $(docker stats --no-stream metabase_bi | awk 'NR==2 {print $4}')
- Espace disque utilisé : $(df / | awk 'NR==2 {print $5}')
- Mémoire utilisée : $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')

## Incidents
- Nombre d'incidents : $(grep "ERROR" /var/log/metabase/metabase.log | wc -l)
- Temps moyen de résolution : [à calculer manuellement]

## Actions effectuées
- Sauvegardes : $(ls /backups/metabase/ | wc -l) sauvegardes
- Mises à jour : [listes des mises à jour]
- Optimisations : [détails des optimisations]

EOF

echo "Rapport mensuel généré: $REPORT_FILE"
```

---

## 💾 GESTION DES SAUVEGARDES

### Stratégie de sauvegarde

#### 1. Sauvegardes automatiques
```yaml
# Configuration dans crontab
0 2 * * * /path/to/scripts/daily-health-check.sh
0 3 * * 0 /path/to/scripts/weekly-backup.sh
0 4 1 * * /path/to/scripts/monthly-report.sh
```

#### 2. Types de sauvegardes
- **Complète** : Base PostgreSQL + données Metabase
- **Incrémentale** : Modifications depuis dernière sauvegarde
- **Configuration** : Fichiers .env et docker-compose
- **Dashboards** : Export JSON des dashboards

#### 3. Stockage des sauvegardes
```bash
# Structure des répertoires de sauvegarde
/backups/metabase/
├── daily/
│   ├── 2024-02-18/
│   └── 2024-02-17/
├── weekly/
│   ├── 2024-W07/
│   └── 2024-W06/
├── monthly/
│   ├── 2024-02/
│   └── 2024-01/
└── config/
    ├── docker-compose.metabase.yml
    └── .env
```

### Restauration

#### 1. Restauration complète
```bash
#!/bin/bash
# restore-backup.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.tar.gz>"
    exit 1
fi

# Arrêter Metabase
docker-compose -f docker-compose.metabase.yml down

# Extraire la sauvegarde
tar -xzf "$BACKUP_FILE" -C /tmp/

# Restaurer la base PostgreSQL
docker-compose -f docker-compose.metabase.yml up -d postgres-metabase
sleep 30
docker exec postgres_metabase psql -U metabase -d metabase < /tmp/*/metabase_db.sql

# Restaurer les données Metabase
docker cp /tmp/*/metabase-data/. metabase_bi:/metabase-data/

# Redémarrer Metabase
docker-compose -f docker-compose.metabase.yml up -d

echo "Restauration terminée"
```

#### 2. Tests de restauration
- **Mensuel** : Tester une restauration sur environnement de test
- **Trimestriel** : Test complet de disaster recovery
- **Annuel** : Revue complète de la stratégie de sauvegarde

---

## 🔄 MISES À JOUR

### Types de mises à jour

#### 1. Mises à jour Metabase
```bash
#!/bin/bash
# update-metabase.sh

NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
    echo "Usage: $0 <new_version>"
    exit 1
fi

echo "Mise à jour Metabase vers la version $NEW_VERSION"

# Sauvegarder avant mise à jour
./scripts/weekly-backup.sh

# Mettre à jour l'image
sed -i "s/metabase\/metabase:.*/metabase\/metabase:$NEW_VERSION/" docker-compose.metabase.yml

# Télécharger la nouvelle image
docker-compose -f docker-compose.metabase.yml pull metabase

# Redémarrer avec la nouvelle version
docker-compose -f docker-compose.metabase.yml up -d

# Vérifier la mise à jour
curl -s "$METABASE_URL/api/session/properties" | jq '.tag'

echo "Mise à jour terminée"
```

#### 2. Mises à jour de sécurité
- **Vulnérabilités** : Scanner régulièrement avec `docker scan`
- **Dépendances** : Mettre à jour les images de base
- **Configuration** : Réviser les permissions et accès

#### 3. Mises à jour des dashboards
- **Requêtes** : Optimiser les requêtes lentes
- **Visuels** : Améliorer l'expérience utilisateur
- **Alertes** : Ajuster les seuils et notifications

### Procédure de mise à jour

#### 1. Préparation
1. **Planifier** : Choisir une fenêtre de maintenance
2. **Sauvegarder** : Effectuer une sauvegarde complète
3. **Tester** : Sur environnement de staging
4. **Communiquer** : Informer les utilisateurs

#### 2. Exécution
1. **Arrêter** : Mettre en mode maintenance
2. **Mettre à jour** : Appliquer les changements
3. **Vérifier** : Tester les fonctionnalités
4. **Redémarrer** : Reprendre le service normal

#### 3. Post-mise à jour
1. **Surveiller** : Vérifier les performances
2. **Documenter** : Noter les changements
3. **Former** : Informer des nouvelles fonctionnalités

---

## 🚨 GESTION DES INCIDENTS

### Classification des incidents

#### Niveau 1 - Critique
- **Service indisponible** : Metabase inaccessible
- **Perte de données** : Corruption de la base
- **Sécurité** : Accès non autorisé

#### Niveau 2 - Majeur
- **Performance dégradée** : Temps de réponse > 10s
- **Fonctionnalités cassées** : Dashboards ne s'affichent pas
- **Données incorrectes** : Requêtes retournent des erreurs

#### Niveau 3 - Mineur
- **Alertes multiples** : Taux d'erreur > 5%
- **Interface lente** : Temps de réponse 5-10s
- **Documentation** : Informations obsolètes

### Procédures de réponse

#### 1. Détection
```bash
#!/bin/bash
# incident-detection.sh

# Vérifier l'état des services
SERVICES_DOWN=()

if ! curl -s "$METABASE_URL/api/health" > /dev/null; then
    SERVICES_DOWN+=("Metabase")
fi

if ! docker exec mongo_db mongosh --eval "db.adminCommand('ismaster')" > /dev/null 2>&1; then
    SERVICES_DOWN+=("MongoDB")
fi

if [ ${#SERVICES_DOWN[@]} -gt 0 ]; then
    echo "🚨 INCIDENT DÉTECTÉ: ${SERVICES_DOWN[*]}"
    # Envoyer alerte immédiate
    curl -X POST "$SLACK_WEBHOOK_URL" -d "{\"text\":\"🚨 INCIDENT CRITIQUE: ${SERVICES_DOWN[*]} sur Metabase\"}"
fi
```

#### 2. Diagnostic
- **Logs système** : Vérifier les erreurs récentes
- **Ressources** : CPU, mémoire, disque, réseau
- **Dépendances** : MongoDB, PostgreSQL, réseau
- **Configuration** : Changements récents

#### 3. Résolution
- **Redémarrage** : Service ou conteneur complet
- **Rollback** : Revenir à la version précédente
- **Restauration** : À partir de sauvegarde
- **Contournement** : Solution temporaire

#### 4. Communication
- **Interne** : Équipe technique et management
- **Externe** : Utilisateurs et stakeholders
- **Mises à jour** : Régulières et transparentes

### Post-incident

#### 1. Analyse
- **Racine** : Cause profonde de l'incident
- **Impact** : Durée et conséquences
- **Leçons** : Ce qui pourrait être amélioré

#### 2. Actions correctives
- **Prévention** : Éviter la récurrence
- **Détection** : Améliorer la surveillance
- **Réponse** : Optimiser les procédures

#### 3. Documentation
- **Rapport d'incident** : Détaillé et factuel
- **Mise à jour** : Procédures et documentation
- **Partage** : Avec l'équipe et les stakeholders

---

## ⚡ PERFORMANCE ET OPTIMISATION

### Surveillance des performances

#### 1. Métriques clés
- **Temps de réponse** : < 5 secondes pour 95% des requêtes
- **Taux d'erreur** : < 1% des requêtes
- **Utilisation CPU** : < 80% en moyenne
- **Utilisation mémoire** : < 85% disponible

#### 2. Outils de monitoring
```bash
# Script de monitoring performance
#!/bin/bash
# performance-monitor.sh

# Métriques Metabase
METABASE_CPU=$(docker stats --no-stream metabase_bi --format "table {{.CPUPerc}}" | tail -n 1)
METABASE_MEM=$(docker stats --no-stream metabase_bi --format "table {{.MemPerc}}" | tail -n 1)

# Temps de réponse API
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$METABASE_URL/api/health")

# Espace disque
DISK_USAGE=$(df / | awk 'NR==2 {print $5}')

echo "$(date),CPU:$METABASE_CPU,MEM:$METABASE_MEM,RESPONSE:$RESPONSE_TIME,DISK:$DISK_USAGE" >> /var/log/metabase/performance.log
```

### Optimisation des requêtes

#### 1. Index MongoDB
```javascript
// Index recommandés pour les performances
db.users.createIndex({ "email": 1, "is_deleted": 1 })
db.users.createIndex({ "role": 1, "created_at": -1 })
db.farms.createIndex({ "isActive": 1, "ratingAvg": -1 })
db.products.createIndex({ "farmId": 1, "isAvailable": 1 })
db.orders.createIndex({ "orderDate": -1, "status": 1 })
db.orders.createIndex({ "farmId": 1, "orderDate": -1 })
db.mobile_payments.createIndex({ "status": 1, "createdAt": -1 })
db.carts.createIndex({ "status": 1, "expiresAt": -1 })
```

#### 2. Optimisation Metabase
- **Cache** : Configurer le cache Redis si disponible
- **Connexions** : Limiter le nombre de connexions simultanées
- **Timeout** : Ajuster les timeouts des requêtes
- **Pagination** : Utiliser pour les grands datasets

### Maintenance préventive

#### 1. Nettoyage régulier
- **Cache obsolète** : Vider mensuellement
- **Logs anciens** : Archiver après 30 jours
- **Sessions expirées** : Nettoyer quotidiennement
- **Temp files** : Supprimer les fichiers temporaires

#### 2. Mise à jour proactive
- **Images Docker** : Mettre à jour mensuellement
- **Dépendances** : Vérifier les vulnérabilités
- **Configuration** : Réviser trimestriellement
- **Documentation** : Maintenir à jour

---

## 📊 CHECKLISTS

### Checklist quotidienne
- [ ] Services Metabase en cours d'exécution
- [ ] Espace disque < 80%
- [ ] Mémoire < 85%
- [ ] Aucune alerte critique
- [ ] Logs sans erreur critique
- [ ] Connexion MongoDB fonctionnelle

### Checklist hebdomadaire
- [ ] Sauvegarde complète effectuée
- [ ] Performance des requêtes vérifiée
- [ ] Nouveaux utilisateurs révisés
- [ ] Qualité des données vérifiée
- [ ] Rapport d'activité généré

### Checklist mensuelle
- [ ] Audit de sécurité effectué
- [ ] Optimisation des performances
- [ ] Nettoyage des données
- [ ] Mises à jour appliquées
- [ ] Documentation mise à jour
- [ ] Test de restauration

---

_**Dernière mise à jour** : 18 février 2026_  
_**Version** : 1.0_  
_**Auteur** : Équipe Aze Farm_
