#!/bin/bash

# Script de test de santé complet pour l'API Aze Farm
# Teste tous les services (API, BD, Cloudinary, Mail, Redis) toutes les 10 minutes

API_URL="https://aze-farm-api.onrender.com"
HEALTH_ENDPOINT="/health"
LOG_FILE="/var/log/aze-farm-health-check.log"
ALERT_EMAIL="herman.moukam5@gmail.com"
TEMP_RESPONSE="/tmp/health_response.json"

# Timestamp pour les logs
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] ========================================" >> $LOG_FILE
echo "[$TIMESTAMP] Début du test de santé complet pour $API_URL" >> $LOG_FILE

# Test de l'endpoint de santé
RESPONSE=$(curl -s -w "%{http_code}" -o "$TEMP_RESPONSE" "$API_URL$HEALTH_ENDPOINT")
HTTP_CODE="${RESPONSE: -3}"

# Variables pour le suivi
OVERALL_STATUS="UNKNOWN"
UNHEALTHY_SERVICES=""
ALERT_SUBJECT=""
ALERT_BODY=""

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "503" ]; then
    # Analyser la réponse JSON
    if [ -f "$TEMP_RESPONSE" ] && command -v jq >/dev/null 2>&1; then
        OVERALL_STATUS=$(jq -r '.status // "unknown"' "$TEMP_RESPONSE" 2>/dev/null || echo "parse_error")
        
        echo "[$TIMESTAMP] 📊 Statut global: $OVERALL_STATUS" >> $LOG_FILE
        
        # Vérifier chaque service
        SERVICES=("database" "cloudinary" "mail" "redis")
        for service in "${SERVICES[@]}"; do
            SERVICE_STATUS=$(jq -r ".services.$service.status // \"unknown\"" "$TEMP_RESPONSE" 2>/dev/null || echo "unknown")
            SERVICE_TIME=$(jq -r ".services.$service.responseTime // \"unknown\"" "$TEMP_RESPONSE" 2>/dev/null || echo "unknown")
            SERVICE_ERROR=$(jq -r ".services.$service.error // \"\"" "$TEMP_RESPONSE" 2>/dev/null || echo "")
            
            if [ "$SERVICE_STATUS" = "healthy" ]; then
                echo "[$TIMESTAMP] ✅ $service: OK ($SERVICE_TIME)" >> $LOG_FILE
            else
                echo "[$TIMESTAMP] ❌ $service: ÉCHEC ($SERVICE_TIME)" >> $LOG_FILE
                if [ -n "$SERVICE_ERROR" ]; then
                    echo "[$TIMESTAMP]    Erreur: $SERVICE_ERROR" >> $LOG_FILE
                fi
                UNHEALTHY_SERVICES="$UNHEALTHY_SERVICES $service"
            fi
        done
        
        # Vérifier le temps de réponse global
        UPTIME=$(jq -r '.uptime // "unknown"' "$TEMP_RESPONSE" 2>/dev/null || echo "unknown")
        echo "[$TIMESTAMP] ⏱️ Uptime: ${UPTIME}s" >> $LOG_FILE
        
    else
        echo "[$TIMESTAMP] ⚠️ Impossible d'analyser la réponse JSON (jq non disponible ou réponse invalide)" >> $LOG_FILE
        echo "[$TIMESTAMP] Réponse brute: $(cat "$TEMP_RESPONSE" 2>/dev/null || echo 'Aucune réponse')" >> $LOG_FILE
        OVERALL_STATUS="parse_error"
    fi
    
    # Déterminer si une alerte est nécessaire
    if [ "$OVERALL_STATUS" = "unhealthy" ] || [ "$OVERALL_STATUS" = "degraded" ] || [ "$OVERALL_STATUS" = "parse_error" ]; then
        ALERT_SUBJECT="🚨 Alerte API Aze Farm - Statut: $OVERALL_STATUS"
        ALERT_BODY="L'API Aze Farm rencontre des problèmes!\n\n"
        ALERT_BODY+="🔗 URL: $API_URL$HEALTH_ENDPOINT\n"
        ALERT_BODY+="📅 Date: $TIMESTAMP\n"
        ALERT_BODY+="📊 Statut global: $OVERALL_STATUS\n"
        ALERT_BODY+="🌐 Code HTTP: $HTTP_CODE\n"
        
        if [ -n "$UNHEALTHY_SERVICES" ]; then
            ALERT_BODY+="\n❌ Services en échec:$UNHEALTHY_SERVICES\n"
        fi
        
        if [ -f "$TEMP_RESPONSE" ]; then
            ALERT_BODY+="\n📋 Réponse complète:\n$(cat "$TEMP_RESPONSE")\n"
        fi
        
        ALERT_BODY+="\n📝 Logs: $LOG_FILE"
    else
        echo "[$TIMESTAMP] ✅ Tous les services sont opérationnels" >> $LOG_FILE
    fi
    
else
    echo "[$TIMESTAMP] ❌ API inaccessible (HTTP $HTTP_CODE)" >> $LOG_FILE
    OVERALL_STATUS="unreachable"
    
    # Afficher la réponse d'erreur si disponible
    if [ -f "$TEMP_RESPONSE" ]; then
        echo "[$TIMESTAMP] Réponse d'erreur: $(cat "$TEMP_RESPONSE")" >> $LOG_FILE
    fi
    
    ALERT_SUBJECT="🚨 Alerte CRITIQUE - API Aze Farm inaccessible"
    ALERT_BODY="L'API Aze Farm est totalement inaccessible!\n\n"
    ALERT_BODY+="🔗 URL testée: $API_URL$HEALTH_ENDPOINT\n"
    ALERT_BODY+="📅 Date: $TIMESTAMP\n"
    ALERT_BODY+="🌐 Code HTTP: $HTTP_CODE\n"
    ALERT_BODY+="📝 Logs: $LOG_FILE"
fi

# Envoyer l'email d'alerte si nécessaire
if [ -n "$ALERT_SUBJECT" ] && command -v mail >/dev/null 2>&1; then
    echo "$ALERT_BODY" | mail -s "$ALERT_SUBJECT" "$ALERT_EMAIL"
    echo "[$TIMESTAMP] 📧 Email d'alerte envoyé à $ALERT_EMAIL" >> $LOG_FILE
elif [ -n "$ALERT_SUBJECT" ]; then
    echo "[$TIMESTAMP] ⚠️ Impossible d'envoyer l'email (command 'mail' non disponible)" >> $LOG_FILE
fi

# Nettoyer le fichier temporaire
rm -f "$TEMP_RESPONSE"

echo "[$TIMESTAMP] Fin du test de santé complet" >> $LOG_FILE
echo "[$TIMESTAMP] ========================================" >> $LOG_FILE
echo "" >> $LOG_FILE

exit 0
