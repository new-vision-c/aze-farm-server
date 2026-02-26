# 🌾 AZE Farm Server

Serveur backend pour la plateforme e-commerce AZE Farm, permettant la gestion de
fermes, produits agricoles et transactions commerciales.

## 📋 Description

AZE Farm Server est une API RESTful complète développée avec Express.js et
TypeScript, conçue pour faciliter le commerce entre fermes locales et
consommateurs. La plateforme offre une recherche avancée de produits, gestion
des fermes, système d'authentification sécurisé, et monitoring en temps réel.

## ✨ Fonctionnalités

- 🔍 **Recherche avancée** : Recherche de produits avec filtres géographiques,
  saisonniers et par catégories
- 📊 **Analytics** : Suivi des tendances de recherche et statistiques de
  performance
- 🏪 **Gestion des fermes** : Inscription, profils et gestion des produits par
  ferme
- 🔐 **Authentification sécurisée** : JWT, OTP, gestion des rôles utilisateurs
- 📧 **Notifications** : Système de notifications push et email
- 🗃️ **Stockage de fichiers** : Upload sécurisé avec MinIO et scan antivirus
  ClamAV
- 📈 **Monitoring** : Métriques Prometheus et tableau de bord Metabase
- 🌐 **Internationalisation** : Support multi-langues
- 🔄 **Cache Redis** : Performance optimisée avec mise en cache
- 📋 **Documentation API** : Swagger UI pour exploration interactive

## 🛠️ Stack Technique

### Backend

- **Framework** : Express.js
- **Langage** : TypeScript
- **ORM** : Prisma
- **Base de données** : MongoDB

### Services

- **Cache** : Redis
- **Stockage** : MinIO
- **Email** : MailHog (dev) / SMTP (prod)
- **Sécurité** : ClamAV (antivirus)
- **Monitoring** : Prometheus + Metabase

### Outils de développement

- **Gestionnaire de paquets** : Bun
- **Linting** : ESLint
- **Formatage** : Prettier
- **Tests** : Vitest
- **Documentation** : Swagger

## 📋 Prérequis

- Node.js 18+
- Docker & Docker Compose
- Bun (recommandé)

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/your-org/aze-farm-server.git
cd aze-farm-server
```

### 2. Installer les dépendances

```bash
bun install
```

### 3. Configuration de l'environnement

Copiez le fichier d'exemple d'environnement :

```bash
cp .env.example .env
```

Modifiez les variables d'environnement selon vos besoins dans `.env`.

### 4. Démarrer avec Docker

```bash
# Démarrer tous les services (MongoDB, Redis, MinIO, etc.)
docker-compose up -d

# Générer le schéma Prisma
bun run prisma:generate

# Appliquer les migrations
bun run prisma:reset
```

### 5. Démarrer le serveur

```bash
# Mode développement
bun run dev

# Build et démarrage en production
bun run build
bun run start
```

## ⚙️ Configuration

### Variables d'environnement principales

| Variable         | Description              | Défaut      |
| ---------------- | ------------------------ | ----------- |
| `PORT`           | Port du serveur          | 3000        |
| `NODE_ENV`       | Environnement            | development |
| `DATABASE_URL`   | URL de connexion MongoDB | -           |
| `REDIS_HOST`     | Host Redis               | redis       |
| `MINIO_ENDPOINT` | Endpoint MinIO           | minio       |
| `JWT_SECRET`     | Clé secrète JWT          | -           |

Voir `.env.example` pour la liste complète des variables.

## 📖 Utilisation

### Démarrage du serveur

```bash
bun run dev
```

Le serveur sera accessible sur `http://localhost:3000`

### Documentation API

- **Swagger UI** : `http://localhost:3000/api-docs`
- **Documentation détaillée** : Voir `SWAGGER_DOCUMENTATION.md`

### Points d'entrée principaux

- **Santé** : `GET /health`
- **Métriques** : `GET /metrics`
- **API** : `GET /api/v1/*`

### Scripts disponibles

```bash
# Développement
bun run dev              # Démarrage avec hot-reload
bun run build            # Build de production
bun run start            # Démarrage en production

# Base de données
bun run prisma:generate  # Générer le client Prisma
bun run prisma:seed      # Alimenter la base avec des données de test
bun run prisma:reset     # Reset complet de la base

# Qualité du code
bun run lint             # Linting
bun run format           # Formatage
bun run type-check       # Vérification des types

# Tests
bun run test             # Exécution des tests
```

## 🏗️ Architecture

```
src/
├── config/          # Configuration (env, swagger, services)
├── controllers/     # Contrôleurs API
├── core/           # Logique métier centrale
├── middlewares/    # Middlewares personnalisés
├── router/         # Définition des routes
├── services/       # Services externes (email, upload, etc.)
├── types/          # Types TypeScript
├── utils/          # Utilitaires
└── index.ts        # Point d'entrée
```

## 🚀 Déploiement

### Avec Docker

```bash
# Build de l'image
docker build -t aze-farm-server .

# Démarrage avec docker-compose
docker-compose -f docker-compose.yml up -d
```

### Avec Render

Le projet est configuré pour le déploiement sur Render :

```bash
# Configuration dans render.yaml
# Services : backend, mongo, redis, minio
```

### Environnements

- **Développement** : `NODE_ENV=development`
- **Production** : `NODE_ENV=production`

## 🔧 Développement

### Structure des commits

Ce projet utilise Conventional Commits :

```bash
<type>[optional scope]: <description>

# Types : feat, fix, docs, style, refactor, test, chore
```

### Tests

```bash
# Exécuter les tests
bun run test

# Tests avec couverture
bun run test:coverage

# Tests en mode watch
bun run test:watch
```

### Linting et formatage

```bash
# Linting automatique
bun run lint

# Formatage
bun run format

# Vérification des types
bun run type-check
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add: AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de code

- **TypeScript strict** : Pas d'utilisation de `any` dans le core
- **Imports organisés** : Utiliser les alias de modules (`@config`, `@services`,
  etc.)
- **Tests unitaires** : Couverture minimale de 80%
- **Documentation** : Commentaires en français

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier `LICENSE` pour plus de détails.

## 👥 Auteurs

- **Barthez Kenwou** - _Développement initial_

## 🙏 Remerciements

- Express.js pour le framework web
- Prisma pour l'ORM
- MongoDB pour la base de données
- Redis pour le cache
- MinIO pour le stockage objet

---

_Dernière mise à jour : Février 2025_
