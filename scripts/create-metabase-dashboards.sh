#!/bin/bash

# =====================================================================================================
# SCRIPT DE CRÉATION AUTOMATISÉE DES DASHBOARDS METABASE
# =====================================================================================================
# Ce script automatise la création des dashboards via l'API Metabase
# Prérequis : Metabase démarré et connexion MongoDB configurée
# =====================================================================================================

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration depuis .env
source .env

METABASE_URL=${METABASE_SITE_URL:-http://localhost:3002}
METABASE_EMAIL=${METABASE_ADMIN_EMAIL:-admin@azefarm.com}
METABASE_PASSWORD=${METABASE_ADMIN_PASSWORD}

# Variables API
METABASE_API_URL="${METABASE_URL}/api"
SESSION_TOKEN=""

# Fonctions de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Connexion à l'API Metabase
login_to_metabase() {
    log_info "Connexion à l'API Metabase..."
    
    LOGIN_RESPONSE=$(curl -s -X POST "${METABASE_API_URL}/session" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"${METABASE_EMAIL}\",
            \"password\": \"${METABASE_PASSWORD}\"
        }")
    
    SESSION_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.id')
    
    if [[ "$SESSION_TOKEN" == "null" ]] || [[ -z "$SESSION_TOKEN" ]]; then
        log_error "Échec de connexion à Metabase. Vérifiez les identifiants."
        echo "Réponse: $LOGIN_RESPONSE"
        exit 1
    fi
    
    log_success "Connexion réussie à Metabase!"
}

# Vérification de la connexion MongoDB
check_mongodb_connection() {
    log_info "Vérification de la connexion MongoDB dans Metabase..."
    
    DATABASES=$(curl -s -X GET "${METABASE_API_URL}/database" \
        -H "Authorization: Bearer ${SESSION_TOKEN}" \
        -H "Content-Type: application/json")
    
    MONGO_DB_ID=$(echo "$DATABASES" | jq -r '.data[] | select(.name=="Aze Farm MongoDB") | .id')
    
    if [[ "$MONGO_DB_ID" == "null" ]] || [[ -z "$MONGO_DB_ID" ]]; then
        log_error "Base de données MongoDB 'Aze Farm MongoDB' non trouvée dans Metabase."
        log_info "Veuillez d'abord configurer la connexion MongoDB dans l'interface Metabase."
        exit 1
    fi
    
    log_success "Base de données MongoDB trouvée (ID: $MONGO_DB_ID)"
}

# Création d'une question (requête)
create_question() {
    local name="$1"
    local query="$2"
    local description="$3"
    
    log_info "Création de la question: $name"
    
    QUESTION_RESPONSE=$(curl -s -X POST "${METABASE_API_URL}/card" \
        -H "Authorization: Bearer ${SESSION_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${name}\",
            \"description\": \"${description}\",
            \"display\": \"table\",
            \"dataset_query\": {
                \"type\": \"native\",
                \"native\": {
                    \"query\": \"${query}\"
                },
                \"database\": ${MONGO_DB_ID}
            }
        }")
    
    QUESTION_ID=$(echo "$QUESTION_RESPONSE" | jq -r '.id')
    
    if [[ "$QUESTION_ID" == "null" ]] || [[ -z "$QUESTION_ID" ]]; then
        log_error "Échec de création de la question: $name"
        echo "Réponse: $QUESTION_RESPONSE"
        return 1
    fi
    
    log_success "Question créée: $name (ID: $QUESTION_ID)"
    echo "$QUESTION_ID"
}

# Création d'un dashboard
create_dashboard() {
    local name="$1"
    local description="$2"
    
    log_info "Création du dashboard: $name"
    
    DASHBOARD_RESPONSE=$(curl -s -X POST "${METABASE_API_URL}/dashboard" \
        -H "Authorization: Bearer ${SESSION_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${name}\",
            \"description\": \"${description}\",
            \"parameters\": []
        }")
    
    DASHBOARD_ID=$(echo "$DASHBOARD_RESPONSE" | jq -r '.id')
    
    if [[ "$DASHBOARD_ID" == "null" ]] || [[ -z "$DASHBOARD_ID" ]]; then
        log_error "Échec de création du dashboard: $name"
        echo "Réponse: $DASHBOARD_RESPONSE"
        return 1
    fi
    
    log_success "Dashboard créé: $name (ID: $DASHBOARD_ID)"
    echo "$DASHBOARD_ID"
}

# Ajout d'une carte à un dashboard
add_card_to_dashboard() {
    local dashboard_id="$1"
    local card_id="$2"
    local row="$3"
    local col="$4"
    
    log_info "Ajout de la carte $card_id au dashboard $dashboard_id"
    
    ADD_RESPONSE=$(curl -s -X POST "${METABASE_API_URL}/dashboard/${dashboard_id}/cards" \
        -H "Authorization: Bearer ${SESSION_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"cardId\": ${card_id},
            \"row\": ${row},
            \"col\": ${col},
            \"sizeX\": 1,
            \"sizeY\": 1
        }")
    
    SUCCESS=$(echo "$ADD_RESPONSE" | jq -r '.success')
    
    if [[ "$SUCCESS" == "true" ]]; then
        log_success "Carte ajoutée au dashboard"
    else
        log_warning "Échec d'ajout de la carte au dashboard"
        echo "Réponse: $ADD_RESPONSE"
    fi
}

# Création du Dashboard Vue Générale Business
create_business_overview_dashboard() {
    log_info "Création du Dashboard Vue Générale Business..."
    
    DASHBOARD_ID=$(create_dashboard "Vue Générale Business" "Vue d'ensemble des performances globales de l'entreprise")
    
    # Création des questions principales
    CA_MENSUEL_ID=$(create_question "CA Mensuel" "SELECT DATE_FORMAT(orderDate, '%Y-%m') as month, SUM(totalAmount) as revenue FROM orders WHERE status != 'CANCELLED' AND orderDate >= DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY month ORDER BY month DESC LIMIT 1" "Chiffre d'affaires du mois en cours")
    
    USERS_TOTAL_ID=$(create_question "Utilisateurs Totals" "SELECT role, COUNT(*) as count FROM users WHERE is_deleted = false GROUP BY role" "Nombre total d'utilisateurs par rôle")
    
    ORDERS_MONTH_ID=$(create_question "Commandes Mensuelles" "SELECT COUNT(*) as order_count FROM orders WHERE status != 'CANCELLED' AND orderDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)" "Nombre de commandes ce mois-ci")
    
    AVG_ORDER_ID=$(create_question "Panier Moyen" "SELECT AVG(totalAmount) as avg_order_value FROM orders WHERE status != 'CANCELLED' AND orderDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)" "Panier moyen des 30 derniers jours")
    
    # Ajout des cartes au dashboard (layout 4x4)
    add_card_to_dashboard "$DASHBOARD_ID" "$CA_MENSUEL_ID" 0 0
    add_card_to_dashboard "$DASHBOARD_ID" "$USERS_TOTAL_ID" 0 1
    add_card_to_dashboard "$DASHBOARD_ID" "$ORDERS_MONTH_ID" 0 2
    add_card_to_dashboard "$DASHBOARD_ID" "$AVG_ORDER_ID" 0 3
    
    log_success "Dashboard Vue Générale Business créé! ID: $DASHBOARD_ID"
}

# Création du Dashboard Performance Fermes
create_farm_performance_dashboard() {
    log_info "Création du Dashboard Performance Fermes..."
    
    DASHBOARD_ID=$(create_dashboard "Performance Fermes" "Analyse détaillée de la performance des fermes")
    
    # Création des questions spécifiques aux fermes
    TOP_FARMS_ID=$(create_question "Top Fermes par CA" "SELECT f.name as farm_name, f.ratingAvg as rating, COUNT(o._id) as order_count, SUM(o.totalAmount) as revenue FROM farms f JOIN orders o ON f._id = o.farmId WHERE o.status != 'CANCELLED' AND o.orderDate >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND f.isActive = true GROUP BY f._id, f.name, f.ratingAvg ORDER BY revenue DESC LIMIT 10" "Top 10 des fermes par chiffre d'affaires")
    
    FARM_RATINGS_ID=$(create_question "Meilleures Notes Fermes" "SELECT name, ratingAvg as rating, ratingCount as review_count, isActive FROM farms WHERE isActive = true AND ratingCount > 0 ORDER BY ratingAvg DESC, ratingCount DESC LIMIT 10" "Fermes avec les meilleures notes")
    
    ACTIVE_FARMS_ID=$(create_question "Fermes Actives" "SELECT COUNT(*) as active_farms FROM farms WHERE isActive = true" "Nombre de fermes actuellement actives")
    
    AVG_RATING_ID=$(create_question "Note Moyenne Globale" "SELECT AVG(ratingAvg) as avg_rating FROM farms WHERE isActive = true AND ratingCount > 0" "Note moyenne de toutes les fermes actives")
    
    # Ajout des cartes au dashboard
    add_card_to_dashboard "$DASHBOARD_ID" "$TOP_FARMS_ID" 0 0
    add_card_to_dashboard "$DASHBOARD_ID" "$FARM_RATINGS_ID" 0 1
    add_card_to_dashboard "$DASHBOARD_ID" "$ACTIVE_FARMS_ID" 0 2
    add_card_to_dashboard "$DASHBOARD_ID" "$AVG_RATING_ID" 0 3
    
    log_success "Dashboard Performance Fermes créé! ID: $DASHBOARD_ID"
}

# Création du Dashboard Analyse Produits
create_product_analysis_dashboard() {
    log_info "Création du Dashboard Analyse Produits..."
    
    DASHBOARD_ID=$(create_dashboard "Analyse Produits" "Performance détaillée des produits et catégories")
    
    # Création des questions spécifiques aux produits
    TOP_PRODUCTS_ID=$(create_question "Produits les Plus Vendus" "SELECT p.name as product_name, p.category, f.name as farm_name, SUM(oi.quantity) as total_quantity, SUM(oi.subtotal) as revenue, COUNT(DISTINCT o._id) as order_count FROM products p JOIN order_items oi ON p._id = oi.productId JOIN orders o ON oi.orderId = o._id JOIN farms f ON p.farmId = f._id WHERE o.status != 'CANCELLED' AND o.orderDate >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY p._id, p.name, p.category, f.name ORDER BY total_quantity DESC LIMIT 20" "Top 20 des produits les plus vendus")
    
    TOTAL_PRODUCTS_ID=$(create_question "Produits Actifs" "SELECT COUNT(*) as active_products FROM products WHERE isAvailable = true" "Nombre total de produits disponibles")
    
    OUT_OF_STOCK_ID=$(create_question "Produits en Rupture" "SELECT COUNT(*) as out_of_stock FROM products WHERE stock = 0 AND isAvailable = true" "Nombre de produits actuellement en rupture de stock")
    
    CATEGORIES_ID=$(create_question "Produits par Catégorie" "SELECT category, COUNT(*) as product_count FROM products WHERE isAvailable = true GROUP BY category ORDER BY product_count DESC" "Répartition des produits par catégorie")
    
    # Ajout des cartes au dashboard
    add_card_to_dashboard "$DASHBOARD_ID" "$TOP_PRODUCTS_ID" 0 0
    add_card_to_dashboard "$DASHBOARD_ID" "$TOTAL_PRODUCTS_ID" 0 1
    add_card_to_dashboard "$DASHBOARD_ID" "$OUT_OF_STOCK_ID" 0 2
    add_card_to_dashboard "$DASHBOARD_ID" "$CATEGORIES_ID" 0 3
    
    log_success "Dashboard Analyse Produits créé! ID: $DASHBOARD_ID"
}

# Création du Dashboard Opérations Techniques
create_operations_dashboard() {
    log_info "Création du Dashboard Opérations Techniques..."
    
    DASHBOARD_ID=$(create_dashboard "Opérations Techniques" "Monitoring des performances techniques et système")
    
    # Création des questions techniques
    PAYMENT_FAILURE_ID=$(create_question "Taux Échec Paiements" "SELECT COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as successful_payments, COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_payments, COUNT(*) as total_payments, ROUND(COUNT(CASE WHEN status = 'FAILED' THEN 1 END) * 100.0 / COUNT(*), 2) as failure_rate FROM mobile_payments WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)" "Taux d'échec des paiements sur 30 jours")
    
    CONVERSION_RATE_ID=$(create_question "Taux Conversion Paniers" "SELECT COUNT(CASE WHEN status = 'CONVERTED' THEN 1 END) as converted_carts, COUNT(CASE WHEN status = 'ABANDONED' THEN 1 END) as abandoned_carts, COUNT(*) as total_carts, ROUND(COUNT(CASE WHEN status = 'CONVERTED' THEN 1 END) * 100.0 / COUNT(*), 2) as conversion_rate FROM carts WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)" "Taux de conversion paniers vers commandes")
    
    PROCESSING_TIME_ID=$(create_question "Temps Traitement Commandes" "SELECT AVG(TIMESTAMPDIFF(HOUR, orderDate, CASE WHEN status = 'DELIVERED' THEN updatedAt WHEN status IN ('CONFIRMED', 'PREPARING', 'READY') THEN updatedAt ELSE NOW() END)) as avg_processing_hours, COUNT(*) as total_orders FROM orders WHERE orderDate >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status != 'CANCELLED'" "Temps moyen de traitement des commandes")
    
    ABANDONED_CARTS_ID=$(create_question "Paniers Abandonnés Valeur" "SELECT CASE WHEN totalAmount < 1000 THEN '0-1000' WHEN totalAmount < 5000 THEN '1000-5000' WHEN totalAmount < 10000 THEN '5000-10000' WHEN totalAmount < 20000 THEN '10000-20000' ELSE '20000+' END as value_range, COUNT(*) as abandoned_count, SUM(totalAmount) as lost_revenue, AVG(totalAmount) as avg_cart_value FROM carts WHERE status = 'ABANDONED' AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY value_range ORDER BY MIN(totalAmount)" "Analyse des paniers abandonnés par tranche de valeur")
    
    # Ajout des cartes au dashboard
    add_card_to_dashboard "$DASHBOARD_ID" "$PAYMENT_FAILURE_ID" 0 0
    add_card_to_dashboard "$DASHBOARD_ID" "$CONVERSION_RATE_ID" 0 1
    add_card_to_dashboard "$DASHBOARD_ID" "$PROCESSING_TIME_ID" 0 2
    add_card_to_dashboard "$DASHBOARD_ID" "$ABANDONED_CARTS_ID" 0 3
    
    log_success "Dashboard Opérations Techniques créé! ID: $DASHBOARD_ID"
}

# Configuration des alertes
setup_alerts() {
    log_info "Configuration des alertes Metabase..."
    
    # Note : La configuration des alertes via API nécessite des permissions supplémentaires
    # Cette section est un placeholder pour une implémentation future
    log_warning "Configuration des alertes à faire manuellement dans l'interface Metabase"
    log_info "Alertes recommandées :"
    log_info "  - CA journalier < 80% de la moyenne"
    log_info "  - Taux d'échec paiement > 5%"
    log_info "  - Stock critique < 10 produits"
    log_info "  - Temps réponse API > 2s"
}

# Génération du rapport de création
generate_creation_report() {
    log_info "Génération du rapport de création..."
    
    cat > /tmp/metabase-dashboards-creation.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "metabase": {
    "url": "$METABASE_URL",
    "admin_email": "$METABASE_EMAIL"
  },
  "dashboards_created": {
    "business_overview": "Vue Générale Business",
    "farm_performance": "Performance Fermes", 
    "product_analysis": "Analyse Produits",
    "operations": "Opérations Techniques"
  },
  "next_steps": [
    "Configurer les filtres globaux",
    "Personnaliser les visuels",
    "Configurer les alertes",
    "Partager avec l'équipe"
  ],
  "access_urls": {
    "metabase": "$METABASE_URL",
    "dashboards": "$METABASE_URL/dashboard"
  }
}
EOF

    log_success "Rapport de création généré : /tmp/metabase-dashboards-creation.json"
}

# Affichage des informations d'accès
show_access_info() {
    echo ""
    echo "===================================================================="
    echo "📊 DASHBOARDS METABASE CRÉÉS AVEC SUCCÈS!"
    echo "===================================================================="
    echo ""
    echo "🔗 Accès Metabase :"
    echo "   URL: $METABASE_URL"
    echo "   Email: $METABASE_EMAIL"
    echo ""
    echo "📈 Dashboards créés :"
    echo "   1. Vue Générale Business"
    echo "   2. Performance Fermes"
    echo "   3. Analyse Produits"
    echo "   4. Opérations Techniques"
    echo ""
    echo "⚙️ Actions recommandées :"
    echo "   1. Personnaliser les visuels et couleurs"
    echo "   2. Configurer les filtres globaux"
    echo "   3. Définir les alertes automatiques"
    echo "   4. Partager les dashboards avec l'équipe"
    echo ""
    echo "📚 Documentation :"
    echo "   Guide complet: docs/metabase-dashboards-guide.md"
    echo "   Requêtes: docs/metabase-queries.md"
    echo ""
    echo "===================================================================="
}

# Fonction principale
main() {
    echo ""
    echo "===================================================================="
    echo "🚀 CRÉATION AUTOMATISÉE DES DASHBOARDS METABASE"
    echo "===================================================================="
    echo ""
    
    # Vérification des prérequis
    if ! command -v jq &> /dev/null; then
        log_error "jq est requis mais n'est pas installé. Installez-le avec: sudo apt-get install jq"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        log_error "curl est requis mais n'est pas installé."
        exit 1
    fi
    
    login_to_metabase
    check_mongodb_connection
    create_business_overview_dashboard
    create_farm_performance_dashboard
    create_product_analysis_dashboard
    create_operations_dashboard
    setup_alerts
    generate_creation_report
    show_access_info
    
    log_success "Création des dashboards terminée!"
}

# Gestion des signaux
trap 'log_error "Script interrompu"; exit 1' INT TERM

# Exécution principale
main "$@"
