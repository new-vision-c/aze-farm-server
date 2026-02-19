#!/bin/bash

# =====================================================================================================
# SCRIPT DE DÉMARRAGE RAPIDE POUR METABASE
# =====================================================================================================
# Ce script facilite le démarrage de Metabase avec la configuration appropriée
# =====================================================================================================

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier si Docker est installé
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé. Veuillez installer Docker d'abord."
        exit 1
    fi
    
    # Vérifier si docker-compose (ou docker compose) est installé
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
        exit 1
    fi
    
    # Vérifier si le fichier .env existe
    if [ ! -f .env ]; then
        log_warning "Fichier .env non trouvé. Création à partir de .env.example..."
        cp .env.example .env
        log_warning "Veuillez éditer le fichier .env et configurer les variables Metabase:"
        log_warning "  - METABASE_DB_PASSWORD"
        log_warning "  - METABASE_ADMIN_PASSWORD"
        read -p "Appuyez sur Entrée une fois le fichier .env configuré..."
    fi
    
    # Vérifier si les variables Metabase sont configurées
    source .env
    if [[ "$METABASE_DB_PASSWORD" == "your_metabase_db_password_here" ]] || [[ "$METABASE_ADMIN_PASSWORD" == "your_metabase_admin_password_here" ]]; then
        log_error "Veuillez configurer les mots de passe Metabase dans le fichier .env"
        exit 1
    fi
    
    # Vérifier si le réseau backend_network existe
    if ! docker network ls | grep -q "backend_network"; then
        log_warning "Réseau backend_network non trouvé. Création du réseau..."
        docker network create backend_network
    fi
    
    log_success "Prérequis vérifiés avec succès!"
}

# Création des répertoires de données
create_data_directories() {
    log_info "Création des répertoires de données..."
    
    mkdir -p "${METABASE_DATA_PATH:-./data/metabase}"
    mkdir -p "${METABASE_POSTGRES_DATA_PATH:-./data/metabase-postgres}"
    
    # Définir les permissions appropriées
    chmod 755 "${METABASE_DATA_PATH:-./data/metabase}"
    chmod 755 "${METABASE_POSTGRES_DATA_PATH:-./data/metabase-postgres}"
    
    log_success "Répertoires de données créés!"
}

# Démarrage des services
start_services() {
    log_info "Démarrage des services Metabase..."
    
    # Démarrer Metabase
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.metabase.yml up -d
    else
        docker compose -f docker-compose.metabase.yml up -d
    fi
    
    log_info "Attente du démarrage des services..."
    sleep 30
    
    # Vérifier si les services sont en cours d'exécution
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    if $COMPOSE_CMD -f docker-compose.metabase.yml ps | grep -q "Up"; then
        log_success "Services Metabase démarrés avec succès!"
    else
        log_error "Erreur lors du démarrage des services. Vérifiez les logs:"
        $COMPOSE_CMD -f docker-compose.metabase.yml logs
        exit 1
    fi
}

# Affichage des informations d'accès
show_access_info() {
    source .env
    
    echo ""
    echo "===================================================================="
    echo "🎉 METABASE EST PRÊT!"
    echo "===================================================================="
    echo ""
    echo "📊 Accès Metabase:"
    echo "   URL: http://localhost:${METABASE_PORT:-3002}"
    echo "   Email: ${METABASE_ADMIN_EMAIL}"
    echo "   Password: [configuré dans .env]"
    echo ""
    echo "🔗 Connexion MongoDB dans Metabase:"
    echo "   Host: ${MONGO_HOST:-mongo}"
    echo "   Port: ${MONGO_PORT:-27017}"
    echo "   Database: ${MONGO_DB:-appDB}"
    echo "   Username: ${MONGO_USER:-admin}"
    echo "   Password: [voir .env]"
    echo "   Authentication Database: ${MONGO_AUTH_SOURCE:-admin}"
    echo "   Replica Set: ${MONGO_REPLICA_SET:-rs0}"
    echo ""
    echo "📝 Commandes utiles:"
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    echo "   Voir les logs: $COMPOSE_CMD -f docker-compose.metabase.yml logs -f"
    echo "   Arrêter: $COMPOSE_CMD -f docker-compose.metabase.yml down"
    echo "   Redémarrer: $COMPOSE_CMD -f docker-compose.metabase.yml restart"
    echo ""
    echo "===================================================================="
}

# Fonction principale
main() {
    echo ""
    echo "===================================================================="
    echo "🚀 DÉMARRAGE DE METABASE - AZE FARM SERVER"
    echo "===================================================================="
    echo ""
    
    check_prerequisites
    create_data_directories
    start_services
    show_access_info
    
    log_success "Installation Metabase terminée!"
}

# Gestion des signaux
trap 'log_error "Script interrompu"; exit 1' INT TERM

# Exécution principale
main "$@"
