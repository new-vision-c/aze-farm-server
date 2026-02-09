export const fr = {
  // Messages généraux
  server: {
    started: 'Serveur démarré avec succès',
    error: 'Erreur interne du serveur',
    not_found: 'Ressource non trouvée',
    unauthorized: 'Non autorisé',
    forbidden: 'Accès interdit',
    bad_request: 'Requête invalide',
  },

  // Messages d'authentification
  auth: {
    login_success: 'Connexion réussie',
    login_failed: 'Échec de la connexion',
    logout_success: 'Déconnexion réussie',
    token_required: 'Token requis',
    token_invalid: 'Token invalide',
    token_expired: 'Token expiré',
    access_denied: 'Accès refusé',
  },

  // Messages pour les utilisateurs
  users: {
    created: 'Utilisateur créé avec succès',
    updated: 'Utilisateur mis à jour avec succès',
    deleted: 'Utilisateur supprimé avec succès',
    not_found: 'Utilisateur non trouvé',
    already_exists: 'Utilisateur déjà existant',
    profile_updated: 'Profil mis à jour avec succès',
  },

  // Messages pour les CRUD génériques
  crud: {
    created: '{resource} créé avec succès',
    updated: '{resource} mis à jour avec succès',
    deleted: '{resource} supprimé avec succès',
    not_found: '{resource} non trouvé',
    list_empty: 'Aucun {resource} trouvé',
    list_loaded: '{count} {resource}(s) chargé(s) avec succès',
  },

  // Messages de validation
  validation: {
    required: 'Le champ {field} est requis',
    invalid_email: "L'email n'est pas valide",
    invalid_format: 'Le format du champ {field} est invalide',
    min_length: 'Le champ {field} doit contenir au moins {min} caractères',
    max_length: 'Le champ {field} ne doit pas dépasser {max} caractères',
    invalid_date: "La date n'est pas valide",
    future_date: 'La date doit être dans le futur',
    past_date: 'La date doit être dans le passé',
  },

  // Messages pour les fichiers
  files: {
    upload_success: 'Fichier téléchargé avec succès',
    upload_error: 'Erreur lors du téléchargement du fichier',
    file_too_large: 'La taille du fichier ne doit pas dépasser {maxSize}',
    invalid_type: 'Type de fichier non autorisé',
    not_found: 'Fichier non trouvé',
    deleted: 'Fichier supprimé avec succès',
  },

  // Messages pour les emails
  emails: {
    sent: 'Email envoyé avec succès',
    send_error: "Erreur lors de l'envoi de l'email",
    template_not_found: "Template d'email non trouvé",
    verification_sent: 'Email de vérification envoyé',
    password_reset_sent: 'Email de réinitialisation du mot de passe envoyé',
  },

  // Messages pour les notifications
  notifications: {
    sent: 'Notification envoyée avec succès',
    send_error: "Erreur lors de l'envoi de la notification",
    push_enabled: 'Notifications push activées',
    push_disabled: 'Notifications push désactivées',
  },

  // Messages pour le système de cache
  cache: {
    cleared: 'Cache nettoyé avec succès',
    error: 'Erreur lors du nettoyage du cache',
    hit: 'Données récupérées depuis le cache',
    miss: 'Données non trouvées dans le cache',
  },

  // Messages pour le monitoring
  monitoring: {
    health_check: 'Vérification de santé terminée',
    service_up: 'Service {service} opérationnel',
    service_down: 'Service {service} indisponible',
    metrics_collected: 'Métriques collectées avec succès',
  },

  // Messages pour les tâches planifiées
  scheduler: {
    task_started: 'Tâche {task} démarrée',
    task_completed: 'Tâche {task} terminée avec succès',
    task_failed: 'Tâche {task} échouée',
    task_scheduled: 'Tâche {task} planifiée',
  },

  // Messages d'erreur
  errors: {
    database_connection: 'Erreur de connexion à la base de données',
    external_service: 'Erreur du service externe {service}',
    timeout: "Délai d'attente dépassé",
    rate_limit: 'Limite de taux dépassée',
    maintenance: 'Service en maintenance',
    quota_exceeded: 'Quota dépassé',
  },

  // Messages de succès
  success: {
    operation_completed: 'Opération terminée avec succès',
    data_saved: 'Données enregistrées avec succès',
    process_completed: 'Processus terminé avec succès',
    sync_completed: 'Synchronisation terminée avec succès',
  },

  // Messages pour l'API
  api: {
    endpoint_not_found: 'Endpoint non trouvé',
    method_not_allowed: 'Méthode non autorisée',
    version_not_supported: "Version de l'API non supportée",
    deprecated: 'Cet endpoint est déprécié',
  },

  // Messages pour la sécurité
  security: {
    csrf_token_invalid: 'Token CSRF invalide',
    rate_limit_exceeded: 'Limite de taux dépassée',
    suspicious_activity: 'Activité suspecte détectée',
    blocked_ip: 'IP bloquée',
    brute_force_detected: 'Tentative de brute force détectée',
  },

  // Messages pour les logs
  logs: {
    created: 'Log créé avec succès',
    exported: 'Logs exportés avec succès',
    cleaned: 'Logs nettoyés avec succès',
    archived: 'Logs archivés avec succès',
  },
};
