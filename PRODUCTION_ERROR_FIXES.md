# 🔧 Guide de Correction des Erreurs de Production

## 📊 Erreurs Identifiées

### 1. **MongoDB SSL/TLS Error**
```
tlsv1 alert internal error: SSL routines:ssl3_read_bytes
```

**Cause** : Problème de certificat SSL/TLS ou mismatch entre client et serveur MongoDB Atlas

**Solution** :

Ajouter à votre `.env` :
```bash
# MongoDB SSL Configuration
MONGODB_SSL_ENABLED=true
MONGODB_SSL_INSECURE=false
MONGODB_SSL_CA_PATH=/etc/ssl/certs/ca-bundle.crt
MONGODB_TLS_VERSION=1.2

# Ou utiliser le schéma de connexion complet
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority&ssl=true&tlsVersion=1.2
```

Modifier `src/services/scheduler/jobs/mongodbBackupJob.ts` :

```typescript
private async runMongoDump(outputDir: string): Promise<void> {
  try {
    const clientOptions = {
      tls: true,
      tlsVersion: 'TLSv1_2_METHOD' || process.env.MONGODB_TLS_VERSION,
      retryWrites: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000, // Augmenter le timeout
    };

    const client = new MongoClient(backupConfig.mongo.uri, clientOptions);
    // ... reste du code
  } catch (error) {
    throw new Error(`Échec de la sauvegarde MongoDB: ${error}`);
  }
}
```

---

### 2. **SMTP Connection Timeout**
```
error: "Connection timeout"
nodeMailer timeout
```

**Cause** : Configuration SMTP incorrecte ou timeout insuffisant pour la connexion réseau

**Solution** :

Ajouter à votre `.env` :
```bash
# SMTP Configuration avec timeouts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
SMTP_POOL=true
SMTP_POOL_SIZE=5
SMTP_CONNECTION_TIMEOUT=10000
SMTP_SOCKET_TIMEOUT=60000
SMTP_GREET_TIMEOUT=10000
```

Modifier `src/services/Mail/_config/transporter.ts` :

```typescript
const transporter = nodemailer.createTransport({
  host: envs.SMTP_HOST,
  port: envs.SMTP_PORT,
  secure: envs.SMTP_SECURE || false,
  auth: {
    user: envs.SMTP_USER,
    pass: envs.SMTP_PASS,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
  connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '10000'),
  socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || '60000'),
  greetingTimeout: parseInt(process.env.SMTP_GREET_TIMEOUT || '10000'),
  logger: true,
  debug: process.env.NODE_ENV === 'development',
});
```

---

### 3. **Backup Job Error Handling**

**Problème** : Erreurs non capturées proprement, notifications échouent

**Solution** : Améliorer la gestion des erreurs

```typescript
// Dans mongodbBackupJob.ts
private async notifyError(error: unknown, context: string): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';

  log.error(`${context}:`, {
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
  });

  if (this.notificationService) {
    try {
      await this.notificationService.sendBackupError(error as Error);
    } catch (notifError) {
      const notifMsg = notifError instanceof Error ? notifError.message : String(notifError);
      log.error('Failed to send backup error notification:', {
        message: notifMsg,
        originalError: errorMessage,
      });
    }
  }
}

// Dans le catch block:
catch (error) {
  await this.notifyError(error, 'MongoDB Backup Failed');
}
```

---

## 🚀 Actions Immédiates

### Étape 1 : Vérifier la Configuration MongoDB
```bash
# Vérifier la connexion MongoDB
mongo "mongodb+srv://<user>:<password>@<cluster>.mongodb.net/test?authSource=admin&ssl=true"

# Ou avec mongosh
mongosh "mongodb+srv://<cluster>/<dbname>" --username <user> --password <password>
```

### Étape 2 : Vérifier la Configuration SMTP
```bash
# Tester la connexion SMTP
nc -zv smtp.gmail.com 587

# Pour Gmail, vérifier :
# - 2-FA est activé
# - Un mot de passe d'application est généré
# - L'adresse email est correcte
```

### Étape 3 : Augmenter les Timeouts en Production
```bash
# Ajouter à Render.yaml ou .env:
MONGODB_TIMEOUT=45000
SMTP_TIMEOUT=60000
HEALTH_CHECK_TIMEOUT=10000
```

---

## ✅ Vérifications Post-Correction

1. **Logs de connexion MongoDB** :
   ```
   ✅ "Connexion à MongoDB établie"
   ✅ "Sauvegarde MongoDB terminée avec succès"
   ```

2. **Logs d'email** :
   ```
   ✅ "Attempting to send email"
   ✅ "Email sent successfully"
   ```

3. **Vérifier les backups**:
   ```
   ✅ Fichiers dans MinIO/S3
   ✅ Métadonnées correctes
   ✅ Rétention appliquée
   ```

---

## 📋 Variables d'Environnement Complètes

Ajouter au fichier `.env.production` :

```bash
# ============================================
# DATABASE - MongoDB Atlas
# ============================================
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority&ssl=true&tlsVersion=1.2
MONGODB_TLS_VERSION=1.2
MONGODB_TIMEOUT=45000

# ============================================
# SMTP - Email Configuration
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
SMTP_POOL=true
SMTP_POOL_SIZE=5
SMTP_CONNECTION_TIMEOUT=10000
SMTP_SOCKET_TIMEOUT=60000
SMTP_GREET_TIMEOUT=10000

# ============================================
# BACKUP - Retention and Notifications
# ============================================
BACKUP_RETENTION_DAYS=30
BACKUP_SERVICE_EMAIL=backup@example.com
BACKUP_ADMIN_EMAIL=admin@example.com

# ============================================
# HEALTH CHECK
# ============================================
HEALTH_CHECK_EMAIL=admin@aze-farm.com
HEALTH_CHECK_API_URL=https://aze-farm-api.onrender.com
```

---

## 🔍 Monitoring Recommandé

1. **Ajouter métriques Prometheus** pour :
   - Durée des backups
   - Taux de réussite/échec
   - Temps de réponse SMTP
   - Connexion MongoDB

2. **Alertes** :
   - Backup failed 3x consécutives
   - SMTP timeout > 30s
   - MongoDB connection lost

3. **Logs structurés** :
   - Timestamp précis
   - Codes d'erreur
   - Contexte complet
