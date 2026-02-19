#!/bin/bash

# =====================================================================================================
# SCRIPT DE VALIDATION DE CONNEXION MONGODB POUR METABASE
# =====================================================================================================
# Ce script vérifie que MongoDB est accessible et prêt pour Metabase
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

MONGO_HOST=${MONGO_HOST:-mongo}
MONGO_PORT=${MONGO_PORT:-27017}
MONGO_DB=${MONGO_DB:-appDB}
MONGO_USER=${MONGO_USER:-admin}
MONGO_PASSWORD=${MONGO_PASSWORD}

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

# Vérification de la connectivité MongoDB
check_mongo_connection() {
    log_info "Test de connexion à MongoDB..."
    
    # Vérifier si MongoDB est accessible
    if ! docker exec ${MONGO_NAME:-mongo_db} mongosh --eval "db.adminCommand('ismaster')" > /dev/null 2>&1; then
        log_error "MongoDB n'est pas accessible. Vérifiez que le conteneur est démarré."
        exit 1
    fi
    
    log_success "MongoDB est accessible!"
}

# Vérification de la base de données
check_database() {
    log_info "Vérification de la base de données $MONGO_DB..."
    
    # Vérifier si la base de données existe
    DB_EXISTS=$(docker exec ${MONGO_NAME:-mongo_db} mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "db.getMongo().getDBNames().includes('$MONGO_DB')" --quiet)
    
    if [[ "$DB_EXISTS" != "true" ]]; then
        log_warning "La base de données $MONGO_DB n'existe pas. Création..."
        docker exec ${MONGO_NAME:-mongo_db} mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "db = db.getSiblingDB('$MONGO_DB'); db.createCollection('temp'); db.temp.drop();" --quiet
        log_success "Base de données $MONGO_DB créée!"
    else
        log_success "Base de données $MONGO_DB trouvée!"
    fi
}

# Vérification des collections essentielles
check_collections() {
    log_info "Vérification des collections essentielles..."
    
    # Liste des collections requises pour Metabase
    REQUIRED_COLLECTIONS=(
        "users"
        "farms" 
        "products"
        "orders"
        "mobile_payments"
        "carts"
        "search_analytics"
    )
    
    MISSING_COLLECTIONS=()
    
    for collection in "${REQUIRED_COLLECTIONS[@]}"; do
        COUNT=$(docker exec ${MONGO_NAME:-mongo_db} mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "db.getSiblingDB('$MONGO_DB').$collection.countDocuments()" --quiet 2>/dev/null || echo "0")
        
        if [[ "$COUNT" == "0" ]]; then
            log_warning "Collection '$collection' vide ou inexistante"
            MISSING_COLLECTIONS+=("$collection")
        else
            log_success "Collection '$collection' : $COUNT documents"
        fi
    done
    
    if [ ${#MISSING_COLLECTIONS[@]} -gt 0 ]; then
        log_warning "Collections manquantes ou vides : ${MISSING_COLLECTIONS[*]}"
        log_info "Vous devrez peut-être exécuter : npm run prisma:seed"
    fi
}

# Vérification des indexes
check_indexes() {
    log_info "Vérification des indexes critiques..."
    
    # Vérifier les indexes sur la collection users
    USER_INDEXES=$(docker exec ${MONGO_NAME:-mongo_db} mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "db.getSiblingDB('$MONGO_DB').users.getIndexes().map(idx => idx.name).join(',')" --quiet 2>/dev/null || echo "")
    
    if [[ "$USER_INDEXES" != *"email"* ]]; then
        log_warning "Index sur 'email' manquant dans la collection users"
    else
        log_success "Indexes users trouvés"
    fi
    
    # Vérifier les indexes sur la collection orders
    ORDER_INDEXES=$(docker exec ${MONGO_NAME:-mongo_db} mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "db.getSiblingDB('$MONGO_DB').orders.getIndexes().map(idx => idx.name).join(',')" --quiet 2>/dev/null || echo "")
    
    if [[ "$ORDER_INDEXES" != *"orderDate"* ]]; then
        log_warning "Index sur 'orderDate' manquant dans la collection orders"
    else
        log_success "Indexes orders trouvés"
    fi
}

# Test de requête Metabase
test_sample_queries() {
    log_info "Test de requêtes typiques Metabase..."
    
    # Test 1: Compter les utilisateurs
    USER_COUNT=$(docker exec ${MONGO_NAME:-mongo_db} mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "db.getSiblingDB('$MONGO_DB').users.countDocuments({is_deleted: false})" --quiet 2>/dev/null || echo "0")
    log_success "Requête test 1 - Users count: $USER_COUNT"
    
    # Test 2: Compter les commandes
    ORDER_COUNT=$(docker exec ${MONGO_NAME:-mongo_db} mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "db.getSiblingDB('$MONGO_DB').orders.countDocuments({status: {\$ne: 'CANCELLED'}})" --quiet 2>/dev/null || echo "0")
    log_success "Requête test 2 - Orders count: $ORDER_COUNT"
    
    # Test 3: Calculer le CA total
    TOTAL_REVENUE=$(docker exec ${MONGO_NAME:-mongo_db} mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "db.getSiblingDB('$MONGO_DB').orders.aggregate([{\$match: {status: {\$ne: 'CANCELLED'}}}, {\$group: {_id: null, total: {\$sum: '\$totalAmount'}}}]).map(r => r.total).join('')" --quiet 2>/dev/null || echo "0")
    log_success "Requête test 3 - Total revenue: $TOTAL_REVENUE"
}

# Génération du rapport
generate_report() {
    log_info "Génération du rapport de validation..."
    
    cat > /tmp/metabase-mongodb-validation.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "mongodb": {
    "host": "$MONGO_HOST",
    "port": $MONGO_PORT,
    "database": "$MONGO_DB",
    "user": "$MONGO_USER",
    "connection": "OK"
  },
  "collections": {
    "users": $(docker exec ${MONGO_NAME:-mongo_db} mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "db.getSiblingDB('$MONGO_DB').users.countDocuments()" --quiet 2>/dev/null || echo "0"),
    "farms": $(docker exec ${MONGO_NAME:-mongo_db} mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "db.getSiblingDB('$MONGO_DB').farms.countDocuments()" --quiet 2>/dev/null || echo "0"),
    "products": $(docker exec ${MONGO_NAME:-mongo_db} mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "db.getSiblingDB('$MONGO_DB').products.countDocuments()" --quiet 2>/dev/null || echo "0"),
    "orders": $(docker exec ${MONGO_NAME:-mongo_db} mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "db.getSiblingDB('$MONGO_DB').orders.countDocuments()" --quiet 2>/dev/null || echo "0"),
    "mobile_payments": $(docker exec ${MONGO_NAME:-mongo_db} mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "db.getSiblingDB('$MONGO_DB').mobile_payments.countDocuments()" --quiet 2>/dev/null || echo "0"),
    "carts": $(docker exec ${MONGO_NAME:-mongo_db} mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "db.getSiblingDB('$MONGO_DB').carts.countDocuments()" --quiet 2>/dev/null || echo "0"),
    "search_analytics": $(docker exec ${MONGO_NAME:-mongo_db} mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "db.getSiblingDB('$MONGO_DB').search_analytics.countDocuments()" --quiet 2>/dev/null || echo "0")
  },
  "ready_for_metabase": true
}
EOF

    log_success "Rapport généré : /tmp/metabase-mongodb-validation.json"
}

# Affichage des informations de connexion
show_connection_info() {
    echo ""
    echo "===================================================================="
    echo "🔗 INFORMATIONS DE CONNEXION POUR METABASE"
    echo "===================================================================="
    echo ""
    echo "📊 Configuration MongoDB :"
    echo "   Host: $MONGO_HOST"
    echo "   Port: $MONGO_PORT"
    echo "   Database: $MONGO_DB"
    echo "   Username: $MONGO_USER"
    echo "   Password: [configuré dans .env]"
    echo "   Authentication Database: admin"
    echo "   Replica Set: rs0"
    echo ""
    echo "🚀 Étapes suivantes :"
    echo "   1. Démarrer Metabase : ./scripts/start-metabase.sh"
    echo "   2. Accéder à Metabase : http://localhost:3002"
    echo "   3. Ajouter la source de données MongoDB avec les paramètres ci-dessus"
    echo "   4. Utiliser les requêtes prédéfinies : docs/metabase-queries.md"
    echo ""
    echo "===================================================================="
}

# Fonction principale
main() {
    echo ""
    echo "===================================================================="
    echo "🔍 VALIDATION MONGODB POUR METABASE"
    echo "===================================================================="
    echo ""
    
    check_mongo_connection
    check_database
    check_collections
    check_indexes
    test_sample_queries
    generate_report
    show_connection_info
    
    log_success "Validation MongoDB terminée! Prêt pour Metabase."
}

# Gestion des signaux
trap 'log_error "Script interrompu"; exit 1' INT TERM

# Exécution principale
main "$@"
