#!/bin/bash

# Script d'installation du cronjob de test de santé pour Aze Farm API

echo "🚀 Installation du cronjob de test de santé pour Aze Farm API..."

# Vérifier si le script de santé existe
HEALTH_SCRIPT="/home/xenos-mh/backdev/nvc-projet/aze-farm-server-1/scripts/health-check.sh"
if [ ! -f "$HEALTH_SCRIPT" ]; then
    echo "❌ Erreur: Le script de santé n'existe pas à $HEALTH_SCRIPT"
    exit 1
fi

# Rendre le script exécutable
chmod +x "$HEALTH_SCRIPT"
echo "✅ Script de santé rendu exécutable"

# Créer le fichier de log s'il n'existe pas
sudo touch /var/log/aze-farm-health-check.log
sudo chmod 666 /var/log/aze-farm-health-check.log
echo "✅ Fichier de log créé: /var/log/aze-farm-health-check.log"

# Ajouter le cronjob
(crontab -l 2>/dev/null; echo "*/10 * * * * $HEALTH_SCRIPT") | crontab -

echo "✅ Cronjob installé avec succès!"
echo ""
echo "📋 Informations:"
echo "   - Le test de santé s'exécutera toutes les 10 minutes"
echo "   - Logs disponibles dans: /var/log/aze-farm-health-check.log"
echo "   - URL testée: https://aze-farm-api.onrender.com/api/health"
echo ""
echo "🔧 Commandes utiles:"
echo "   - Voir les cronjobs: crontab -l"
echo "   - Voir les logs: tail -f /var/log/aze-farm-health-check.log"
echo "   - Supprimer le cronjob: crontab -r"
echo ""
echo "✨ Installation terminée!"
