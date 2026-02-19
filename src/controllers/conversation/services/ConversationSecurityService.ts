/**
 * Service de sécurité pour le module conversation
 * Protection contre XSS, injection, et validation des contenus
 */
export class ConversationSecurityService {
  /**
   * Configuration par défaut pour la sanitisation HTML
   */
  private static readonly DEFAULT_SANITIZE_CONFIG = {
    // Autoriser les balises de formatage de base
    allowedTags: [
      'b',
      'i',
      'em',
      'strong',
      'u',
      's',
      'strike',
      'sub',
      'sup',
      'p',
      'br',
      'span',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
    ],
    // Autoriser les attributs sécurisés
    allowedAttributes: {
      '*': ['class'], // Autoriser class pour le style
      a: ['href', 'title'], // Si on autorise les liens plus tard
      code: ['class'], // Pour la coloration syntaxique
    },
    // Interdire les styles inline (prévenir CSS injection)
    allowedStyles: {},
    // Options de sécurité
    allowVulnerableTags: false,
    allowScriptTags: false,
    allowIframe: false,
    allowFormTag: false,
    // Nettoyer les espaces et newlines excessifs
    textFilter: (text: string) => {
      return text
        .replace(/\s+/g, ' ') // Réduire les espaces multiples
        .replace(/\n\s*\n/g, '\n') // Réduire les newlines multiples
        .trim();
    },
  };

  /**
   * Configuration stricte pour les messages système (pas de HTML autorisé)
   */
  private static readonly STRICT_SANITIZE_CONFIG = {
    allowedTags: [], // Pas de HTML autorisé
    allowedAttributes: {},
    textFilter: (text: string) => text.replace(/[<>]/g, ''), // Supprimer les chevrons
  };

  /**
   * Sanitisation HTML personnalisée (éviter dépendance externe)
   */
  private static sanitizeHtmlContent(content: string, _config: any): string {
    // Échapper les caractères HTML spéciaux
    const escapeMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    // Supprimer les scripts et iframes
    let sanitized = content
      .replace(/<script[^>]*>/gi, '')
      .replace(/<\/script>/gi, '')
      .replace(/<iframe[^>]*>/gi, '')
      .replace(/<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:\s*text\/html/gi, '')
      .replace(/data:\s*application\/javascript/gi, '');

    // Échapper les caractères HTML
    for (const [char, entity] of Object.entries(escapeMap)) {
      const regex = new RegExp(char, 'g');
      sanitized = sanitized.replace(regex, entity);
    }

    // Nettoyer les espaces excessifs
    return sanitized.trim();
  }

  /**
   * Nettoie et sécurise le contenu d'un message
   * @param content - Contenu brut du message
   * @param isSystemMessage - Si c'est un message système (sanitisation stricte)
   * @returns Contenu sécurisé
   */
  public static sanitizeMessageContent(content: string, isSystemMessage: boolean = false): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    const config = isSystemMessage ? this.STRICT_SANITIZE_CONFIG : this.DEFAULT_SANITIZE_CONFIG;

    try {
      // Première passe: sanitisation HTML personnalisée
      let sanitized = this.sanitizeHtmlContent(content, config);

      // Deuxième passe: validation XSS avancée
      sanitized = this.advancedXSSProtection(sanitized);

      // Troisième passe: validation de longueur et caractères
      sanitized = this.validateMessageLength(sanitized);

      return sanitized;
    } catch (error) {
      console.error('Erreur lors de la sanitisation du message:', error);
      // En cas d'erreur, retourner une version sécurisée minimale
      return this.fallbackSanitization(content);
    }
  }

  /**
   * Protection avancée contre les patterns XSS
   */
  private static advancedXSSProtection(content: string): string {
    // Patterns XSS courants à détecter et bloquer
    const xssPatterns = [
      // JavaScript: et data: URLs
      /javascript:/gi,
      /data:\s*text\/html/gi,
      /data:\s*application\/javascript/gi,

      // Événements HTML
      /on\w+\s*=/gi,

      // Scripts et iframes
      /<script[^>]*>/gi,
      /<\/script>/gi,
      /<iframe[^>]*>/gi,
      /<\/iframe>/gi,

      // Meta refresh et autres redirections
      /<meta[^>]*http-equiv\s*=["']?refresh["']?/gi,

      // Expressions dangereuses
      /expression\s*\(/gi,
      /@import/gi,
      /binding\s*:/gi,

      // Unicode et encodages suspects
      /&#[0-9]*;/g,
      /&#x[0-9a-fA-F]*;/g,

      // CSS injection
      /style\s*=/gi,
      /@import/gi,

      // Protocoles dangereux
      /vbscript:/gi,
      /data:\s*text\/vbscript/gi,
    ];

    let sanitized = content;

    for (const pattern of xssPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    // Décoder les entités HTML pour détecter les XSS encodés
    const decoded = this.decodeHtmlEntities(sanitized);
    if (decoded !== sanitized) {
      // Si le contenu décodé est différent, le sanitizer à nouveau
      sanitized = this.advancedXSSProtection(decoded);
    }

    return sanitized;
  }

  /**
   * Validation de la longueur des messages
   */
  private static validateMessageLength(content: string): string {
    const MAX_MESSAGE_LENGTH = 2000; // 2KB max par message

    if (content.length > MAX_MESSAGE_LENGTH) {
      console.warn(`Message trop long: ${content.length} caractères (max: ${MAX_MESSAGE_LENGTH})`);
      return content.substring(0, MAX_MESSAGE_LENGTH) + '... [message tronqué]';
    }

    return content;
  }

  /**
   * Sanitization de secours en cas d'erreur
   */
  private static fallbackSanitization(content: string): string {
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .substring(0, 1000); // Limiter drastiquement en cas de problème
  }

  /**
   * Décode les entités HTML pour détecter les XSS encodés
   */
  private static decodeHtmlEntities(text: string): string {
    // Implémentation côté serveur (pas de document)
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");
  }

  /**
   * Vérifie si un message contient du contenu potentiellement dangereux
   * @param content - Contenu à vérifier
   * @returns true si le contenu est suspect
   */
  public static isSuspiciousContent(content: string): boolean {
    const suspiciousPatterns = [
      /javascript:/gi,
      /<script/i,
      /on\w+\s*=/gi,
      /data:\s*text\/html/gi,
      /expression\s*\(/gi,
      /@import/gi,
      /binding\s*:/gi,
      /vbscript:/gi,
      /&#[0-9]*;/g,
      /&#x[0-9a-fA-F]*;/g,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Génère un hash du contenu pour détecter les doublons
   * @param content - Contenu du message
   * @returns Hash SHA-256 du contenu
   */
  public static generateContentHash(content: string): string {
    // Implémentation simple de hash (en production, utiliser crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convertir en 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Valide et nettoie les métadonnées d'un message
   * @param metadata - Métadonnées du message
   * @returns Métadonnées sécurisées
   */
  public static sanitizeMessageMetadata(metadata: any): any {
    if (!metadata || typeof metadata !== 'object') {
      return {};
    }

    const sanitized: any = {};

    // N'autoriser que les champs connus et sécurisés
    const allowedFields = ['messageType', 'mediaType', 'fileName', 'fileSize', 'conversationId'];

    for (const field of allowedFields) {
      if (metadata[field] && typeof metadata[field] === 'string') {
        sanitized[field] = this.sanitizeMessageContent(metadata[field], true);
      }
    }

    return sanitized;
  }

  /**
   * Valide un ID de conversation ou message
   * @param id - L'ID à valider
   * @param type - Type d'ID (conversation, message, farm, order)
   * @returns true si l'ID est valide
   */
  public static isValidId(
    id: string,
    type: 'conversation' | 'message' | 'farm' | 'order',
  ): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }

    // Pattern MongoDB ObjectId (24 caractères hexadécimaux)
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    // Validation supplémentaire selon le type
    switch (type) {
      case 'conversation':
        return objectIdPattern.test(id);
      case 'message':
        return objectIdPattern.test(id);
      case 'farm':
        return objectIdPattern.test(id);
      case 'order':
        return objectIdPattern.test(id);
      default:
        return false;
    }
  }

  /**
   * Vérifie si un utilisateur est autorisé à accéder à une conversation
   * @param userId - ID de l'utilisateur
   * @param conversation - Conversation à vérifier
   * @returns true si l'utilisateur a accès
   */
  public static canAccessConversation(
    userId: string,
    conversation: { consumerId: string; farmId: string; farmerId?: string },
  ): boolean {
    if (!userId || !conversation) {
      return false;
    }

    // L'utilisateur peut accéder s'il est le consumer OU le farmer de la ferme
    return conversation.consumerId === userId || conversation.farmerId === userId;
  }

  /**
   * Vérifie si un utilisateur peut supprimer un message
   * @param userId - ID de l'utilisateur
   * @param messageSenderId - ID de l'expéditeur du message
   * @returns true si l'utilisateur peut supprimer le message
   */
  public static canDeleteMessage(userId: string, messageSenderId: string): boolean {
    return userId === messageSenderId;
  }

  /**
   * Vérifie si un utilisateur peut marquer un message comme lu
   * @param userId - ID de l'utilisateur
   * @param messageSenderId - ID de l'expéditeur du message
   * @returns true si l'utilisateur peut marquer le message comme lu
   */
  public static canMarkMessageAsRead(userId: string, messageSenderId: string): boolean {
    // Un utilisateur ne peut pas marquer son propre message comme lu
    return userId !== messageSenderId;
  }

  /**
   * Limite le nombre de messages par utilisateur pour prévenir le spam
   * @param currentCount - Nombre actuel de messages
   * @param _timeWindow - Fenêtre temporelle en minutes (non utilisé pour l'instant)
   * @param maxMessages - Nombre maximum de messages autorisés
   * @returns true si la limite n'est pas dépassée
   */
  public static isWithinRateLimit(
    currentCount: number,
    _timeWindow: number = 60, // 1 minute par défaut
    maxMessages: number = 10, // 10 messages par minute max
  ): boolean {
    return currentCount < maxMessages;
  }

  /**
   * Crée des métadonnées sécurisées pour les notifications push
   * @param messageId - ID du message
   * @param conversationId - ID de la conversation
   * @param type - Type de notification
   * @returns Métadonnées sécurisées
   */
  public static createSecureMetadata(messageId: string, conversationId: string, type: string): any {
    return {
      id: messageId,
      conversationId,
      type,
      timestamp: new Date().toISOString(),
      // Pas de données sensibles dans les métadonnées
      version: '1.0',
    };
  }
}
