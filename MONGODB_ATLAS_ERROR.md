# 🔴 Problème MongoDB Atlas - Résolution

## Erreur observée

```
Kind: Server selection timeout: No available servers
Kind: I/O error: received fatal alert: InternalError
```

**Serveurs affectés:** Tous les 3 nœuds du Replica Set Atlas
**Cause:** Erreur TLS/SSL lors de la connexion

---

## 🔍 Diagnostic

L'erreur indique que MongoDB Atlas rejette la connexion avec une alerte **"InternalError"** au niveau TLS. Cela peut être dû à :

1. **Certificat expiré ou révoqué** ❌
2. **Version TLS incompatible** ❌
3. **IP non whitelistée** ❌
4. **Problème réseau entre le serveur et Atlas** ❌
5. **Fichier CA racine expiré** ❌

---

## ✅ Solutions

### **Option 1: Vérifier la configuration MongoDB (rapide)**

```bash
# 1. Vérifier la connectivité avec MongoDB Atlas
mongosh "mongodb+srv://cesaristos5:50VPTVyd82Y2wmPF@environementtestnvc.a21hzv7.mongodb.net/aze-farm-test"

# 2. Vérifier les logs Atlas
# https://cloud.mongodb.com/v2/652f5428e0649c26b4da1f1d#logs/clusters

# 3. Whitelist l'adresse IP
# https://cloud.mongodb.com/v2/652f5428e0649c26b4da1f1d#networking/accessList
```

### **Option 2: Utiliser MongoDB local (meilleur pour le développement)**

```bash
# 1. Installer MongoDB
# Ubuntu: sudo apt-get install -y mongodb

# 2. Démarrer MongoDB
mongod

# 3. Modifier le .env
DATABASE_URL="mongodb://localhost:27017/aze-farm-test"
```

### **Option 3: Ajouter les paramètres TLS au .env (avancé)**

```bash
# Ajouter ces options à la chaîne de connexion
DATABASE_URL="mongodb+srv://cesaristos5:50VPTVyd82Y2wmPF@environementtestnvc.a21hzv7.mongodb.net/aze-farm-test?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true"
```

⚠️ **Attention:** `tlsAllowInvalidCertificates=true` est à éviter en production.

### **Option 4: Vérifier le certificat CA (expert)**

```bash
# Vérifier le certificat MongoDB Atlas
openssl s_client -connect ac-dvrjqvr-shard-00-00.a21hzv7.mongodb.net:27017 -showcerts

# Vérifier les certificats système
ls -la /etc/ssl/certs/ | grep mongodb
```

---

## 🚀 Recommandation immédiate

**Pour le développement local:** Utilisez **MongoDB Community Edition** au lieu d'Atlas.

```bash
# Installer MongoDB Community
# macOS:
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu:
sudo apt-get install -y mongodb

# Démarrer:
mongod
```

**Modifiez le .env:**
```env
DATABASE_URL="mongodb://localhost:27017/aze-farm-test"
```

---

## 📋 Checklist de dépannage

- [ ] Vérifier la whitelist IP sur Atlas Cloud Console
- [ ] Tester la connexion avec `mongosh` CLI
- [ ] Vérifier les logs du cluster Atlas
- [ ] Essayer avec `tlsAllowInvalidCertificates=true` temporairement
- [ ] Installer MongoDB local comme alternative
- [ ] Vérifier la version Node.js (18.0+)
- [ ] Vérifier la version de `@prisma/client` (5.22.0)
- [ ] Redémarrer le serveur après changement de .env

---

## 📞 Support

**Si le problème persiste:**

1. Accédez à MongoDB Atlas Cloud Console
2. Vérifiez Network Access → Your IP Address
3. Vérifiez Database → Connection String
4. Consultez les logs sous Monitoring → Logs

---

**Créé:** 11 février 2026  
**Status:** 🔴 MongoDB Atlas inaccessible  
**Impact:** Authentification bloquée  
**Résolution:** Switching to local MongoDB recommended
