-- =====================================================================================================
-- SCRIPT D'INITIALISATION POSTGRES POUR METABASE
-- =====================================================================================================
-- Ce script est exécuté automatiquement lors du premier démarrage du conteneur PostgreSQL
-- Il prépare la base de données pour une utilisation optimale avec Metabase
-- =====================================================================================================

-- Créer les extensions nécessaires pour Metabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configuration optimisée pour les performances Metabase
-- Augmenter les limites pour les requêtes complexes
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Optimiser pour les requêtes analytiques
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Configuration du logging pour le monitoring
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = 'on';
ALTER SYSTEM SET log_connections = 'on';
ALTER SYSTEM SET log_disconnections = 'on';
ALTER SYSTEM SET log_lock_waits = 'on';

-- Recharger la configuration PostgreSQL
SELECT pg_reload_conf();

-- Créer un utilisateur readonly pour les connexions externes si nécessaire
-- (utile pour les outils de monitoring externes)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'metabase_readonly') THEN
        CREATE ROLE metabase_readonly WITH LOGIN PASSWORD 'readonly_password';
        GRANT CONNECT ON DATABASE metabase TO metabase_readonly;
        GRANT USAGE ON SCHEMA public TO metabase_readonly;
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO metabase_readonly;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO metabase_readonly;
    END IF;
END
$$;

-- Afficher un message de confirmation
\echo '===================================================================='
\echo 'Base de données Metabase initialisée avec succès!'
\echo 'Extensions installées: uuid-ossp, pg_stat_statements, pg_trgm'
\echo 'Configuration optimisée pour les requêtes analytiques'
\echo 'Utilisateur readonly créé: metabase_readonly'
\echo '===================================================================='
