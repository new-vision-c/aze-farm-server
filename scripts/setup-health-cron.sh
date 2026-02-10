#!/bin/bash

# Script d'installation du cronjob de test de santé complet pour Aze Farm API

echo "🚀 Installation du cronjob de test de santé complet pour Aze Farm API..."

# Vérifier si le script de santé existe
HEALTH_SCRIPT="/home/xenos-mh/backdev/nvc-projet/aze-farm-server-1/scripts/health-check.sh"
if [ ! -f "$HEALTH_SCRIPT" ]; then
    echo "❌ Erreur: Le script de santé n'existe pas à $HEALTH_SCRIPT"
    exit 1
fi

# Rendre le script exécutable
chmod +x "$HEALTH_SCRIPT"
echo "✅ Script de santé rendu exécutable"

# Installer les dépendances nécessaires
echo "📦 Installation des dépendances..."

# Vérifier et installer curl
if ! command -v curl >/dev/null 2>&1; then
    echo "Installation de curl..."
    sudo apt-get update && sudo apt-get install -y curl
fi

# Vérifier et installer jq (pour le parsing JSON)
if ! command -v jq >/dev/null 2>&1; then
    echo "Installation de jq..."
    sudo apt-get update && sudo apt-get install -y jq
fi

# Vérifier et installer mailutils (pour les emails)
if ! command -v mail >/dev/null 2>&1; then
    echo "📧 Installation de mailutils pour les notifications email..."
    sudo apt-get update && sudo apt-get install -y mailutils
    echo "⚠️ Vous devrez peut-être configurer postfix ou un autre MTA pour les emails"
fi

# Créer le fichier de log s'il n'existe pas
sudo touch /var/log/aze-farm-health-check.log
sudo chmod 666 /var/log/aze-farm-health-check.log
echo "✅ Fichier de log créé: /var/log/aze-farm-health-check.log"

# Ajouter le cronjob
(crontab -l 2>/dev/null; echo "*/10 * * * * $HEALTH_SCRIPT") | crontab -

echo "✅ Cronjob installé avec succès!"
echo ""
echo "📋 Configuration:"
echo "   - Test de santé toutes les 10 minutes"
echo "   - URL testée: https://aze-farm-api.onrender.com/health"
echo "   - Services testés: API, Database, Cloudinary, Mail, Redis"
echo "   - Email d'alerte: herman.moukam5@gmail.com"
echo "   - Logs: /var/log/aze-farm-health-check.log"
echo ""
echo "🔧 Commandes utiles:"
echo "   - Voir les cronjobs: crontab -l"
echo "   - Voir les logs: tail -f /var/log/aze-farm-health-check.log"
echo "   - Tester manuellement: $HEALTH_SCRIPT"
echo "   - Supprimer le cronjob: crontab -r"
echo ""
echo "📧 Configuration email:"
echo "   - Les emails seront envoyés automatiquement en cas d'échec"
echo "   - Vérifiez que le MTA (postfix/sendmail) est configuré"
echo "   - Test d'envoi: echo 'Test email' | mail -s 'Test' herman.moukam5@gmail.com"
echo ""
echo "✨ Installation terminée!"
