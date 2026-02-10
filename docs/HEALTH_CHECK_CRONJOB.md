# Cronjob de Test de Santé - Aze Farm API

## Description

Ce cronjob effectue des tests de santé automatiques sur l'API Aze Farm toutes
les 10 minutes pour vérifier que le service est opérationnel.

## Fichiers

- `scripts/health-check.sh` - Script principal de test de santé
- `scripts/setup-health-cron.sh` - Script d'installation automatique
- `crontab.txt` - Documentation de configuration du cronjob

## Installation Rapide

### Option 1: Installation Automatique (Recommandée)

```bash
# Exécuter le script d'installation
./scripts/setup-health-cron.sh
```

### Option 2: Installation Manuelle

1. **Rendre le script exécutable**:

   ```bash
   chmod +x scripts/health-check.sh
   ```

2. **Créer le fichier de log**:

   ```bash
   sudo touch /var/log/aze-farm-health-check.log
   sudo chmod 666 /var/log/aze-farm-health-check.log
   ```

3. **Installer le cronjob**:
   ```bash
   crontab -e
   # Ajouter la ligne suivante:
   */10 * * * * /home/xenos-mh/backdev/nvc-projet/aze-farm-server-1/scripts/health-check.sh
   ```

## Configuration

- **URL testée**: `https://aze-farm-api.onrender.com/health`
- **Fréquence**: Toutes les 10 minutes
- **Logs**: `/var/log/aze-farm-health-check.log`

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
tail -n 20 /var/log/aze-farm-health-check.log
```

### Supprimer le cronjob

```bash
crontab -r
```

### Tester manuellement le script

```bash
./scripts/health-check.sh
```

## Format des Logs

```
[2025-02-10 14:30:00] Début du test de santé pour https://aze-farm-api.onrender.com
[2025-02-10 14:30:01] ✅ API est en bonne santé (HTTP 200)
[2025-02-10 14:30:01] Réponse: {"status":"ok","timestamp":"2025-02-10T14:30:01.000Z"}
[2025-02-10 14:30:01] Fin du test de santé
----------------------------------------
```

## Personnalisation

### Modifier la fréquence

Éditez le cronjob avec `crontab -e` et modifiez la planification:

- Toutes les 5 minutes: `*/5 * * * *`
- Toutes les 30 minutes: `*/30 * * * *`
- Toutes les heures: `0 * * * *`

### Modifier l'URL

Éditez `scripts/health-check.sh` et changez la variable `API_URL`.

### Ajouter une notification email

Décommentez et modifiez la ligne dans `scripts/health-check.sh`:

```bash
echo "L'API Aze Farm n'est pas disponible! Code: $HTTP_CODE" | mail -s "Alerte API Aze Farm" votre-email@example.com
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

### Erreur de connexion

1. Testez l'URL manuellement: `curl https://aze-farm-api.onrender.com/health`
2. Vérifiez la connectivité réseau: `ping aze-farm-api.onrender.com`

## Sécurité

- Le script s'exécute avec les permissions de l'utilisateur
- Les logs sont stockés dans `/var/log/` avec permissions appropriées
- Aucune information sensible n'est stockée dans les logs
