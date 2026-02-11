# 🔐 Guide de Test Authentification avec i18n

## 📋 Vue d'ensemble

Ce guide explique comment tester **complètement** l'API d'authentification avec les messages internationalisés en **français (FR)** et **anglais (EN)**.

Collection Postman disponible: `postman-auth-i18n.json`

---

## 🚀 Démarrage rapide

### 1. Importer la collection Postman
1. Ouvrir Postman
2. Cliquer sur **Import**
3. Charger le fichier `postman-auth-i18n.json`
4. Définir la variable `base_url` → `http://localhost:3000/api`

### 2. Démarrer le serveur
```bash
cd /home/xenos-mh/backdev/nvc-projet/aze-farm-server-1
ts-node-dev -r tsconfig-paths/register --respawn --transpile-only src/index.ts
```

### 3. Tester les routes

---

## 📝 Scénarios de test complets

### **1️⃣ Registration (Inscription)**

#### ✅ Cas réussi - Français
**Endpoint:** `POST /auth/register/step1`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "fullname": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "password": "SecurePassword123!"
}
```

**Réponse attendue (FR):**
```json
{
  "success": true,
  "message": "Inscription réussie",
  "data": {
    "sessionToken": "eyJhbGc...",
    "email": "jean.dupont@example.com",
    "fullname": "Jean Dupont"
  }
}
```

**Clés de traduction utilisées:**
- `auth.registration_step1_success` → "Inscription réussie"

---

#### ✅ Cas réussi - Anglais
**Endpoint:** `POST /auth/register/step1`
**Header:** `Accept-Language: en-US,en;q=0.9`
**Body:**
```json
{
  "fullname": "John Smith",
  "email": "john.smith@example.com",
  "password": "SecurePassword123!"
}
```

**Réponse attendue (EN):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "sessionToken": "eyJhbGc...",
    "email": "john.smith@example.com",
    "fullname": "John Smith"
  }
}
```

**Clés de traduction utilisées:**
- `auth.registration_step1_success` → "Registration successful"

---

#### ❌ Email invalide - Français
**Endpoint:** `POST /auth/register/step1`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "fullname": "Jean Dupont",
  "email": "not-an-email",
  "password": "SecurePassword123!"
}
```

**Réponse attendue (FR):**
```json
{
  "success": false,
  "message": "L'email n'est pas valide",
  "code": 400
}
```

**Clés de traduction utilisées:**
- `validation.invalid_email` → "L'email n'est pas valide"

---

#### ❌ Mot de passe faible - Français
**Endpoint:** `POST /auth/register/step1`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "fullname": "Jean Dupont",
  "email": "jean.dupont2@example.com",
  "password": "weak"
}
```

**Réponse attendue (FR):**
```json
{
  "success": false,
  "message": "Le mot de passe doit contenir au moins 8 caractères",
  "code": 400
}
```

**Clés de traduction utilisées:**
- `validation.password_too_short` → "Le mot de passe doit contenir au moins 8 caractères"

---

#### ❌ Email déjà existant - Français
**Endpoint:** `POST /auth/register/step1`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "fullname": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "password": "SecurePassword123!"
}
```

**Réponse attendue (FR):**
```json
{
  "success": false,
  "message": "Utilisateur déjà existant",
  "code": 409
}
```

**Clés de traduction utilisées:**
- `users.already_exists` → "Utilisateur déjà existant"

---

### **2️⃣ OTP Verification (Vérification OTP)**

#### ✅ Cas réussi - Français
**Endpoint:** `POST /auth/verify-otp`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "sessionToken": "{{session_token}}",
  "otp_code": "123456"
}
```

**Réponse attendue (FR):**
```json
{
  "success": true,
  "message": "Email vérifié avec succès",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "jean.dupont@example.com"
  }
}
```

**Clés de traduction utilisées:**
- `auth.email_verified_success` → "Email vérifié avec succès"

---

#### ❌ Code OTP invalide - Français
**Endpoint:** `POST /auth/verify-otp`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "sessionToken": "{{session_token}}",
  "otp_code": "000000"
}
```

**Réponse attendue (FR):**
```json
{
  "success": false,
  "message": "Code OTP invalide",
  "code": 400
}
```

**Clés de traduction utilisées:**
- `validation.otp_invalid` → "Code OTP invalide"

---

#### ❌ Session expirée - Français
**Endpoint:** `POST /auth/verify-otp`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "sessionToken": "invalid_or_expired_token",
  "otp_code": "123456"
}
```

**Réponse attendue (FR):**
```json
{
  "success": false,
  "message": "Votre session a expiré. Veuillez recommencer le processus d'inscription.",
  "code": 401
}
```

**Clés de traduction utilisées:**
- `validation.session_expired` → "Votre session a expiré. Veuillez recommencer le processus d'inscription."

---

#### ✅ Renvoyer OTP - Français
**Endpoint:** `POST /auth/resend-otp`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "sessionToken": "{{session_token}}"
}
```

**Réponse attendue (FR):**
```json
{
  "success": true,
  "message": "Un nouvel OTP a été envoyé à votre adresse email",
  "data": {
    "email": "jean.dupont@example.com"
  }
}
```

**Clés de traduction utilisées:**
- `auth.otp_resent_success` → "Un nouvel OTP a été envoyé à votre adresse email"

---

### **3️⃣ Login (Connexion)**

#### ✅ Cas réussi - Français
**Endpoint:** `POST /auth/login`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "email": "jean.dupont@example.com",
  "password": "SecurePassword123!"
}
```

**Réponse attendue (FR):**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "jean.dupont@example.com",
      "fullname": "Jean Dupont",
      "role": "user",
      "is_verified": true,
      "is_active": true
    }
  }
}
```

**Clés de traduction utilisées:**
- `auth.login_success` → "Connexion réussie"

**Cookies définis:**
- `refreshToken` (httpOnly, secure)

---

#### ✅ Cas réussi - Anglais
**Endpoint:** `POST /auth/login`
**Header:** `Accept-Language: en-US,en;q=0.9`
**Body:**
```json
{
  "email": "john.smith@example.com",
  "password": "SecurePassword123!"
}
```

**Réponse attendue (EN):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john.smith@example.com",
      "fullname": "John Smith",
      "role": "user",
      "is_verified": true,
      "is_active": true
    }
  }
}
```

**Clés de traduction utilisées:**
- `auth.login_success` → "Login successful"

---

#### ❌ Email introuvable - Français
**Endpoint:** `POST /auth/login`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "email": "nonexistent@example.com",
  "password": "SecurePassword123!"
}
```

**Réponse attendue (FR):**
```json
{
  "success": false,
  "message": "Échec de la connexion",
  "code": 401
}
```

**Clés de traduction utilisées:**
- `auth.login_failed` → "Échec de la connexion"

---

#### ❌ Mot de passe invalide - Français
**Endpoint:** `POST /auth/login`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "email": "jean.dupont@example.com",
  "password": "WrongPassword123!"
}
```

**Réponse attendue (FR):**
```json
{
  "success": false,
  "message": "Échec de la connexion",
  "code": 401
}
```

**Clés de traduction utilisées:**
- `auth.login_failed` → "Échec de la connexion"

---

#### ❌ Compte non vérifié - Français
**Endpoint:** `POST /auth/login`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "email": "unverified@example.com",
  "password": "SecurePassword123!"
}
```

**Réponse attendue (FR):**
```json
{
  "success": false,
  "message": "Accès refusé",
  "code": 403
}
```

**Clés de traduction utilisées:**
- `auth.access_denied` → "Accès refusé"

---

#### ❌ Compte inactif - Français
**Endpoint:** `POST /auth/login`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "email": "inactive@example.com",
  "password": "SecurePassword123!"
}
```

**Réponse attendue (FR):**
```json
{
  "success": false,
  "message": "Accès refusé",
  "code": 403
}
```

**Clés de traduction utilisées:**
- `auth.access_denied` → "Accès refusé"

---

### **4️⃣ Password Management (Gestion des mots de passe)**

#### ✅ Mot de passe oublié - Français
**Endpoint:** `POST /auth/forgot-password`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "email": "jean.dupont@example.com"
}
```

**Réponse attendue (FR):**
```json
{
  "success": true,
  "message": "Un email de réinitialisation a été envoyé",
  "data": {
    "email": "jean.dupont@example.com"
  }
}
```

**Clés de traduction utilisées:**
- `auth.password_reset_email_sent` → "Un email de réinitialisation a été envoyé"

---

#### ❌ Utilisateur non trouvé - Français
**Endpoint:** `POST /auth/forgot-password`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "email": "nonexistent@example.com"
}
```

**Réponse attendue (FR):**
```json
{
  "success": false,
  "message": "Utilisateur non trouvé",
  "code": 404
}
```

**Clés de traduction utilisées:**
- `users.not_found` → "Utilisateur non trouvé"

---

#### ✅ Réinitialiser le mot de passe - Français
**Endpoint:** `POST /auth/reset-password`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "resetToken": "{{reset_token}}",
  "newPassword": "NewSecurePassword123!"
}
```

**Réponse attendue (FR):**
```json
{
  "success": true,
  "message": "Mot de passe changé avec succès",
  "data": {
    "email": "jean.dupont@example.com"
  }
}
```

**Clés de traduction utilisées:**
- `auth.password_changed_success` → "Mot de passe changé avec succès"

---

#### ❌ Token invalide - Français
**Endpoint:** `POST /auth/reset-password`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "resetToken": "invalid_token",
  "newPassword": "NewSecurePassword123!"
}
```

**Réponse attendue (FR):**
```json
{
  "success": false,
  "message": "Token invalide",
  "code": 400
}
```

**Clés de traduction utilisées:**
- `validation.token_invalid` → "Token invalide"

---

#### ❌ Token expiré - Français
**Endpoint:** `POST /auth/reset-password`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`
**Body:**
```json
{
  "resetToken": "{{expired_token}}",
  "newPassword": "NewSecurePassword123!"
}
```

**Réponse attendue (FR):**
```json
{
  "success": false,
  "message": "Token expiré",
  "code": 401
}
```

**Clés de traduction utilisées:**
- `validation.token_expired` → "Token expiré"

---

#### ✅ Changer le mot de passe (Authentifié) - Français
**Endpoint:** `POST /auth/change-password`
**Header:** 
- `Accept-Language: fr-FR,fr;q=0.9`
- `Authorization: Bearer {{access_token}}`

**Body:**
```json
{
  "currentPassword": "SecurePassword123!",
  "newPassword": "AnotherSecurePassword123!"
}
```

**Réponse attendue (FR):**
```json
{
  "success": true,
  "message": "Mot de passe changé avec succès",
  "data": {
    "email": "jean.dupont@example.com"
  }
}
```

**Clés de traduction utilisées:**
- `auth.password_changed_success` → "Mot de passe changé avec succès"

---

### **5️⃣ Logout & Token (Déconnexion)**

#### ✅ Déconnexion - Français
**Endpoint:** `POST /auth/logout`
**Header:**
- `Accept-Language: fr-FR,fr;q=0.9`
- `Authorization: Bearer {{access_token}}`

**Body:** (vide)

**Réponse attendue (FR):**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

**Clés de traduction utilisées:**
- `auth.logout_success` → "Déconnexion réussie"

---

#### ❌ Déconnexion sans token - Français
**Endpoint:** `POST /auth/logout`
**Header:** `Accept-Language: fr-FR,fr;q=0.9`

**Body:** (vide)

**Réponse attendue (FR):**
```json
{
  "success": false,
  "message": "Token requis",
  "code": 401
}
```

**Clés de traduction utilisées:**
- `auth.token_required` → "Token requis"

---

## 📊 Tableau récapitulatif des messages i18n

| Clé de traduction | Français | Anglais | Contexte |
|---|---|---|---|
| `auth.registration_step1_success` | "Inscription réussie" | "Registration successful" | Inscription réussie |
| `auth.login_success` | "Connexion réussie" | "Login successful" | Connexion réussie |
| `auth.login_failed` | "Échec de la connexion" | "Login failed" | Email/password invalides |
| `auth.logout_success` | "Déconnexion réussie" | "Logout successful" | Déconnexion |
| `auth.access_denied` | "Accès refusé" | "Access denied" | Compte non vérifié/inactif |
| `auth.token_required` | "Token requis" | "Token required" | Token manquant |
| `auth.token_invalid` | "Token invalide" | "Invalid token" | Token invalide |
| `auth.token_expired` | "Token expiré" | "Token expired" | Token expiré |
| `auth.email_verified_success` | "Email vérifié avec succès" | "Email verified successfully" | OTP valide |
| `auth.password_changed_success` | "Mot de passe changé avec succès" | "Password changed successfully" | Mot de passe changé |
| `auth.password_reset_email_sent` | "Un email de réinitialisation a été envoyé" | "Password reset email sent" | Email de réinitialisation envoyé |
| `auth.otp_resent_success` | "Un nouvel OTP a été envoyé à votre adresse email" | "A new OTP has been sent to your email" | OTP renvoyé |
| `validation.invalid_email` | "L'email n'est pas valide" | "Email is not valid" | Format email invalide |
| `validation.password_too_short` | "Le mot de passe doit contenir au moins {min} caractères" | "Password must be at least {min} characters" | Mot de passe trop court |
| `validation.otp_invalid` | "Code OTP invalide" | "Invalid OTP code" | OTP invalide |
| `validation.token_invalid` | "Token invalide" | "Invalid token" | Reset token invalide |
| `validation.token_expired` | "Token expiré" | "Token expired" | Reset token expiré |
| `validation.session_expired` | "Votre session a expiré. Veuillez recommencer le processus d'inscription." | "Your session has expired. Please restart the registration process." | Session OTP expirée |
| `users.already_exists` | "Utilisateur déjà existant" | "User already exists" | Email déjà enregistré |
| `users.not_found` | "Utilisateur non trouvé" | "User not found" | Utilisateur introuvable |

---

## 🔧 Configuration des variables Postman

Pour automatiser les tests, définir les variables suivantes :

```javascript
// Après un login réussi, ajouter ceci dans Tests:
if (pm.response.code === 200 && pm.response.json().data.accessToken) {
    pm.environment.set("access_token", pm.response.json().data.accessToken);
}

// Après une inscription réussie, ajouter ceci :
if (pm.response.code === 200 && pm.response.json().data.sessionToken) {
    pm.environment.set("session_token", pm.response.json().data.sessionToken);
}
```

---

## 🎯 Checklist de test

### Inscription (Registration)
- [ ] ✅ Inscription réussie (FR)
- [ ] ✅ Inscription réussie (EN)
- [ ] ❌ Email invalide
- [ ] ❌ Mot de passe faible
- [ ] ❌ Email déjà existant

### Vérification OTP
- [ ] ✅ OTP valide
- [ ] ❌ OTP invalide
- [ ] ❌ Session expirée
- [ ] ✅ Renvoyer OTP

### Connexion
- [ ] ✅ Connexion réussie (FR)
- [ ] ✅ Connexion réussie (EN)
- [ ] ❌ Email introuvable
- [ ] ❌ Mot de passe invalide
- [ ] ❌ Compte non vérifié
- [ ] ❌ Compte inactif

### Gestion des mots de passe
- [ ] ✅ Mot de passe oublié
- [ ] ❌ Utilisateur non trouvé (forgot-password)
- [ ] ✅ Réinitialiser le mot de passe
- [ ] ❌ Token invalide
- [ ] ❌ Token expiré
- [ ] ✅ Changer le mot de passe (authentifié)

### Déconnexion
- [ ] ✅ Déconnexion réussie
- [ ] ❌ Déconnexion sans token

---

## 💡 Conseils

1. **Tester les deux langues** pour chaque scenario
2. **Vérifier les codes HTTP** (200, 400, 401, 403, 404, 409)
3. **Vérifier les tokens** sont correctement définis dans les cookies
4. **Vérifier les paramètres** dans les messages (ex: minutes pour OTP)
5. **Valider la structure JSON** des réponses
6. **Tester le rate limiting** en envoyant plusieurs requêtes rapidement

---

**Créé:** 11 février 2026
**Version:** 1.0
**Collection:** postman-auth-i18n.json
