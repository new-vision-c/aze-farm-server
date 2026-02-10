# Configuration MongoDB Atlas pour Render

## Problème original
- **Erreur**: `tlsv1 alert internal error` lors de la connexion à MongoDB Atlas
- **Cause**: Paramètres SSL/TLS manquants ou incomplets dans l'URI de connexion

## Solution appliquée

### Paramètres ajoutés à l'URI MongoDB

```
mongodb+srv://cesaristos5:50VPTVyd82Y2wmPF@environementtestnvc.a21hzv7.mongodb.net/aze-farm-test?retryWrites=true&w=majority&authSource=admin&tls=true&tlsAllowInvalidCertificates=true&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000
```

### Explication des paramètres

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| `retryWrites` | `true` | Réessayer automatiquement les écritures en cas d'échec temporaire |
| `w` | `majority` | Attendre une confirmation de la majorité des répliques (par défaut Atlas) |
| `authSource` | `admin` | Spécifier la base de données pour l'authentification (MongoDB Atlas) |
| `tls` | `true` | Forcer la connexion TLS/SSL |
| `tlsAllowInvalidCertificates` | `true` | Accepter les certificats invalides (nécessaire pour Render sans CA root) |
| `serverSelectionTimeoutMS` | `5000` | Timeout de sélection du serveur (5 secondes) |
| `connectTimeoutMS` | `10000` | Timeout de connexion initial (10 secondes) |

### Fichiers modifiés

1. **render.yaml**
   - `DATABASE_URL`: URI complète avec tous les paramètres SSL/TLS
   - `MONGO_URL`: URI de base pour les connexions serveur-serveur

2. **.env.render.example**
   - Mise à jour des URIs pour inclure les paramètres
   - Commentaires actualisés

### Configuration dans le code

- **Prisma** (`prisma/schema.prisma`): Utilise `DATABASE_URL` directement ✅
- **Backup Job** (`src/services/scheduler/jobs/mongodbBackupJob.ts`): Utilise `DATABASE_URL` ✅
- **MongoClient natif**: Utilise `backupConfig.mongo.uri` qui pointe à `DATABASE_URL` ✅

## Vérifications supplémentaires requises

### 1. MongoDB Atlas Network Access
Vérifier que les adresses IP Render sont whitelistées:
- Option 1: Aller dans MongoDB Atlas → Security → Network Access
- Option 2: Ajouter `0.0.0.0/0` (tous les IPs, **non recommandé en production**)
- Option 3: Ajouter l'IP de Render (si statique)

Pour Render, les IPs changent dynamiquement, donc recommandation:
**Utiliser `0.0.0.0/0` ou configurer un VPC pour Render**

### 2. Credentials MongoDB
Vérifier que l'utilisateur `cesaristos5` a les bonnes permissions:
- Accès en lecture/écriture à `aze-farm-test`
- Rôle `dbOwner` ou `readWrite`

### 3. Vérification locale
Pour tester avant le déploiement:
```bash
# Remplacer les credentials si nécessaire dans .env.local
echo "DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/db?retryWrites=true&w=majority&authSource=admin&tls=true&tlsAllowInvalidCertificates=true&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000" > .env.local

# Compiler et exécuter
bun run build
bun run start
```

## Erreurs courantes et solutions

### "tlsv1 alert internal error"
- ✅ **Résolu**: Ajout de `tlsAllowInvalidCertificates=true`
- Alternative: Ajouter `tlsCertificateKeyFile` si certificat CA disponible

### "MongoDB connection timeout"
- Augmenter `serverSelectionTimeoutMS` et `connectTimeoutMS`
- Vérifier la whitelist d'IPs dans MongoDB Atlas
- Vérifier la connectivité réseau depuis Render

### "Authentication failed"
- Vérifier `authSource=admin`
- Vérifier l'encodage URL des credentials (special chars)
- Vérifier le mot de passe (copy-paste de MongoDB Atlas)

## Monitoring

Le HealthCheckJob teste la connexion MongoDB toutes les 10 minutes:
```
src/services/scheduler/jobs/healthCheckJob.ts
```

Erreurs envoyées à: `herman.moukam5@gmail.com`

## Déploiement Render

Après ce changement:
1. Git push automatique déclenche redéploiement
2. Render reconstruit l'image Docker
3. Environment variables appliquées
4. Service redémarre avec nouvelle configuration

Temps d'attente typique: 2-5 minutes
