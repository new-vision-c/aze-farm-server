#!/bin/bash

# Script de test de santé pour l'API Aze Farm
# Teste l'endpoint de santé toutes les 10 minutes

API_URL="https://aze-farm-api.onrender.com"
HEALTH_ENDPOINT="/health"
LOG_FILE="/var/log/aze-farm-health-check.log"

# Timestamp pour les logs
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Début du test de santé pour $API_URL" >> $LOG_FILE

# Test de l'endpoint de santé
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$API_URL$HEALTH_ENDPOINT")
HTTP_CODE="${RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "[$TIMESTAMP] ✅ API est en bonne santé (HTTP $HTTP_CODE)" >> $LOG_FILE
    # Afficher la réponse si disponible
    if [ -f /tmp/health_response.json ]; then
        echo "[$TIMESTAMP] Réponse: $(cat /tmp/health_response.json)" >> $LOG_FILE
    fi
else
    echo "[$TIMESTAMP] ❌ API n'est pas en bonne santé (HTTP $HTTP_CODE)" >> $LOG_FILE
    # Afficher la réponse d'erreur si disponible
    if [ -f /tmp/health_response.json ]; then
        echo "[$TIMESTAMP] Réponse d'erreur: $(cat /tmp/health_response.json)" >> $LOG_FILE
    fi
    
    # Optionnel: Envoyer une notification ou un email en cas d'échec
    # echo "L'API Aze Farm n'est pas disponible! Code: $HTTP_CODE" | mail -s "Alerte API Aze Farm" votre-email@example.com
fi

# Nettoyer le fichier temporaire
rm -f /tmp/health_response.json

echo "[$TIMESTAMP] Fin du test de santé" >> $LOG_FILE
echo "----------------------------------------" >> $LOG_FILE

exit 0
