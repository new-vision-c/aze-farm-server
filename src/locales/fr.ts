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
    verification_success: 'Compte vérifié avec succès',
    user_already_verified: 'Utilisateur déjà vérifié',
    otp_invalid: 'Code OTP invalide',
    otp_expired: 'Le code OTP a expiré',
    user_not_authenticated: 'Utilisateur non authentifié',
    credentials_invalid: 'Identifiants invalides',
    account_disabled: 'Compte désactivé',
    password_reset_sent_if_exists: "Si l'email existe, un code de réinitialisation a été envoyé",
    otp_sent_for_password_reset: 'Code OTP envoyé pour la réinitialisation du mot de passe',
    email_otp_sent: 'Un code OTP a été envoyé à votre adresse email',
    otp_email_subject: 'Code de réinitialisation de mot de passe',
    otp_email_subject_otp: 'Code de vérification',
    invalid_or_expired_otp: 'Code OTP invalide ou expiré',
    session_token_generated: 'Token de session généré avec succès',
    invalid_session_token: 'Token de session invalide',
    password_reset_success: 'Mot de passe réinitialisé avec succès',
    otp_welcome_message:
      'Nous sommes ravis de vous accueillir dans la grande famille AzeFarm ! Pour finaliser la vérification de votre compte, veuillez utiliser le code ci-dessous.',
    otp_validity_message:
      "Ce code est valable pendant 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.",
    otp_thank_you:
      "Merci de faire confiance à AzeFarm. Ensemble, façonnons l'avenir avec technologie et passion.",
    otp_platform_description: 'Une plateforme de vente de produits agricoles',
    welcome_email_subject: 'Bienvenue sur AzeFarm',
    welcome_platform_description: 'Une plateforme de vente de produits agricoles',
    welcome_message:
      'Nous sommes ravis de vous accueillir dans la grande famille AzeFarm ! Votre compte a été créé avec succès.',
    welcome_next_steps:
      'Pour commencer à utiliser notre plateforme, veuillez vérifier votre adresse email en utilisant le code qui vous a été envoyé.',
    welcome_cta_button: 'Vérifier mon compte',
    welcome_thank_you: "Merci de faire confiance à AzeFarm. Ensemble, cultivons l'avenir !",
  },

  // Messages pour les utilisateurs
  users: {
    created: 'Utilisateur créé avec succès',
    updated: 'Utilisateur mis à jour avec succès',
    deleted: 'Utilisateur supprimé avec succès',
    not_found: 'Utilisateur non trouvé',
    already_exists: 'Utilisateur déjà existant',
    profile_updated: 'Profil mis à jour avec succès',
    profile_retrieved: 'Profil récupéré avec succès',
  },

  // Messages de validation
  validation: {
    email_required: "L'email est requis",
    email_and_otp_required: "L'email et le code OTP sont requis",
    all_fields_required: 'Tous les champs sont requis',
    passwords_not_match: 'Les mots de passe ne correspondent pas',
    password_too_short: 'Le mot de passe doit contenir au moins 6 caractères',
    required: 'Le champ {field} est requis',
    invalid_email: "L'email n'est pas valide",
    invalid_format: 'Le format du champ {field} est invalide',
    min_length: 'Le champ {field} doit contenir au moins {min} caractères',
    max_length: 'Le champ {field} ne doit pas dépasser {max} caractères',
    invalid_date: "La date n'est pas valide",

    // Validation des mots de passe
    password_required: 'Le mot de passe est requis',
    password_too_weak:
      'Le mot de passe doit contenir au moins 6 caractères avec une majuscule, une minuscule et un chiffre',
    password_min_length: 'Le mot de passe doit contenir au moins {min} caractères',
    password_uppercase: 'Le mot de passe doit contenir au moins une majuscule',
    password_lowercase: 'Le mot de passe doit contenir au moins une minuscule',
    password_number: 'Le mot de passe doit contenir au moins un chiffre',

    // Validation OTP
    otp_required: 'Le code OTP est requis',
    otp_invalid_length: 'Le code OTP doit contenir exactement 6 chiffres',
    otp_invalid_format: 'Le code OTP doit être composé de chiffres uniquement',

    // Validation noms
    fullname_required: 'Le nom complet est requis',
    fullname_too_short: 'Le nom complet doit contenir au moins {min} caractères',
    fullname_too_long: 'Le nom complet ne doit pas dépasser {max} caractères',

    // Validation téléphone
    phone_required: 'Le numéro de téléphone est requis',
    phone_invalid_format: 'Le numéro de téléphone doit être une chaîne de caractères',
    phone_too_short: 'Le numéro de téléphone est trop court (minimum {min} caractères)',
    phone_too_long: 'Le numéro de téléphone est trop long (maximum {max} caractères)',

    // Validation rôles
    role_required: 'Le rôle est requis',
    role_invalid: 'Le rôle doit être USER, ADMIN ou MODERATOR',

    // Validation tokens
    reset_token_required: 'Le token de réinitialisation est requis',
    current_password_required: 'Le mot de passe actuel est requis',
    new_password_required: 'Le nouveau mot de passe est requis',

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
    server_error: 'Erreur interne du serveur',
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
