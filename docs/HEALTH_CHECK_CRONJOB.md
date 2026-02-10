# Cronjob de Test de Santé Complet - Aze Farm API

## Description

Ce cronjob effectue des tests de santé complets sur l'API Aze Farm toutes les 10
minutes en vérifiant tous les services critiques :

- **API** - Disponibilité et temps de réponse
- **Base de données (MongoDB)** - Connectivité et temps de réponse
- **Cloudinary** - Service de stockage d'images
- **Service Mail** - Configuration SMTP et envoi
- **Redis** - Service de cache

En cas d'échec de l'un des services, une alerte email est automatiquement
envoyée à `herman.moukam5@gmail.com`.

## Fichiers

- `scripts/health-check.sh` - Script principal de test de santé complet
- `scripts/setup-health-cron.sh` - Script d'installation automatique avec
  dépendances
- `crontab.txt` - Documentation de configuration du cronjob
- `src/controllers/_config/healthcheck/health.controllers.ts` - Controller de
  santé amélioré

## Installation Rapide

### Option 1: Installation Automatique (Recommandée)

```bash
# Exécuter le script d'installation (installe automatiquement les dépendances)
./scripts/setup-health-cron.sh
```

### Option 2: Installation Manuelle

1. **Installer les dépendances**:

   ```bash
   sudo apt-get update
   sudo apt-get install -y curl jq mailutils
   ```

2. **Rendre le script exécutable**:

   ```bash
   chmod +x scripts/health-check.sh
   ```

3. **Créer le fichier de log**:

   ```bash
   sudo touch /var/log/aze-farm-health-check.log
   sudo chmod 666 /var/log/aze-farm-health-check.log
   ```

4. **Installer le cronjob**:
   ```bash
   crontab -e
   # Ajouter la ligne suivante:
   */10 * * * * /home/xenos-mh/backdev/nvc-projet/aze-farm-server-1/scripts/health-check.sh
   ```

## Configuration

- **URL testée**: `https://aze-farm-api.onrender.com/health`
- **Fréquence**: Toutes les 10 minutes
- **Logs**: `/var/log/aze-farm-health-check.log`
- **Email d'alerte**: `herman.moukam5@gmail.com`
- **Services testés**: API, Database, Cloudinary, Mail, Redis

## Commandes Utiles

### Vérifier les cronjobs actifs

```bash
crontab -l
```

### Voir les logs en temps réel

```bash
tail -f /var/log/aze-farm-health-check.log
```

### Voir les derniers logs

```bash
tail -n 50 /var/log/aze-farm-health-check.log
```

### Supprimer le cronjob

```bash
crontab -r
```

### Tester manuellement le script

```bash
./scripts/health-check.sh
```

### Tester l'envoi d'email

```bash
echo "Test de notification" | mail -s "Test API Aze Farm" herman.moukam5@gmail.com
```

## Format des Logs

```
[2025-02-10 14:30:00] ========================================
[2025-02-10 14:30:00] Début du test de santé complet pour https://aze-farm-api.onrender.com
[2025-02-10 14:30:01] 📊 Statut global: ok
[2025-02-10 14:30:01] ✅ database: OK (45ms)
[2025-02-10 14:30:01] ✅ cloudinary: OK (123ms)
[2025-02-10 14:30:01] ✅ mail: OK (89ms)
[2025-02-10 14:30:01] ✅ redis: OK (12ms)
[2025-02-10 14:30:01] ⏱️ Uptime: 86400s
[2025-02-10 14:30:01] ✅ Tous les services sont opérationnels
[2025-02-10 14:30:01] Fin du test de santé complet
[2025-02-10 14:30:01] ========================================
```

## Réponse de l'API

L'endpoint `/health` retourne une réponse JSON détaillée :

```json
{
  "status": "ok",
  "timestamp": "2025-02-10T14:30:01.000Z",
  "services": {
    "api": { "status": "healthy", "responseTime": "0ms" },
    "database": { "status": "healthy", "responseTime": "45ms", "type": "mongodb" },
    "cloudinary": { "status": "healthy", "responseTime": "123ms" },
    "mail": { "status": "healthy", "responseTime": "89ms", "provider": "smtp.gmail.com" },
    "redis": { "status": "healthy", "responseTime": "12ms" }
  },
  "uptime": 86400,
  "memory": {
    "rss": 134217728,
    "heapTotal": 67108864,
    "heapUsed": 45088768,
    "external": 2097152
  },
  "version": "1.0.0"
}
```

## Alertes Email

### Déclenchement des alertes

Les alertes sont envoyées dans les cas suivants :

1. **API inaccessible** - Code HTTP différent de 200/503
2. **Statut "unhealthy"** - Tous les services sont en échec
3. **Statut "degraded"** - Au moins un service est en échec
4. **Erreur de parsing** - Réponse JSON invalide

### Format des emails

**Sujet**: `🚨 Alerte API Aze Farm - Statut: degraded`

**Corps**:

```
L'API Aze Farm rencontre des problèmes!

🔗 URL: https://aze-farm-api.onrender.com/health
📅 Date: 2025-02-10 14:30:01
📊 Statut global: degraded
🌐 Code HTTP: 200

❌ Services en échec: database mail

📋 Réponse complète:
{... réponse JSON complète ...}

📝 Logs: /var/log/aze-farm-health-check.log
```

## Personnalisation

### Modifier la fréquence

Éditez le cronjob avec `crontab -e` et modifiez la planification:

- Toutes les 5 minutes: `*/5 * * * *`
- Toutes les 30 minutes: `*/30 * * * *`
- Toutes les heures: `0 * * * *`

### Modifier l'email d'alerte

Éditez `scripts/health-check.sh` et changez la variable `ALERT_EMAIL`:

```bash
ALERT_EMAIL="votre-email@example.com"
```

### Modifier l'URL

Éditez `scripts/health-check.sh` et changez la variable `API_URL`.

### Désactiver les emails

Commentez la section d'envoi d'email dans le script:

```bash
# if [ -n "$ALERT_SUBJECT" ] && command -v mail >/dev/null 2>&1; then
#     echo "$ALERT_BODY" | mail -s "$ALERT_SUBJECT" "$ALERT_EMAIL"
#     echo "[$TIMESTAMP] 📧 Email d'alerte envoyé à $ALERT_EMAIL" >> $LOG_FILE
# fi
```

## Dépannage

### Le cronjob ne s'exécute pas

1. Vérifiez que le service cron est actif: `sudo systemctl status cron`
2. Vérifiez les permissions: `ls -la scripts/health-check.sh`
3. Vérifiez le cronjob: `crontab -l`

### Pas de logs générés

1. Vérifiez les permissions du fichier de log:
   `ls -la /var/log/aze-farm-health-check.log`
2. Vérifiez que curl est installé: `which curl`
3. Vérifiez que jq est installé: `which jq`

### Emails non envoyés

1. Vérifiez que mailutils est installé: `which mail`
2. Testez l'envoi manuel:
   `echo "Test" | mail -s "Test" herman.moukam5@gmail.com`
3. Vérifiez la configuration du MTA: `sudo systemctl status postfix`

### Erreur de connexion Cloudinary

1. Vérifiez les variables d'environnement Cloudinary
2. Testez manuellement: `curl "https://api.cloudinary.com/v1_1/demo/ping"`

### Erreur de connexion Redis

1. Vérifiez que Redis est accessible: `redis-cli -h host -p port ping`
2. Vérifiez les variables REDIS_HOST et REDIS_PORT

## Sécurité

- Le script s'exécute avec les permissions de l'utilisateur
- Les logs sont stockés dans `/var/log/` avec permissions appropriées
- Les emails contiennent des informations de diagnostic mais pas de données
  sensibles
- Aucun mot de passe ou clé API n'est stocké dans les logs

## Dépendances

Le script nécessite les outils suivants :

- `curl` - Pour les requêtes HTTP
- `jq` - Pour le parsing JSON
- `mailutils` - Pour l'envoi d'emails
- `cron` - Pour la planification automatique

L'installation automatique (`setup-health-cron.sh`) installe toutes ces
dépendances.
