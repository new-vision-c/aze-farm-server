/**
 * Script pour ajouter automatiquement la documentation @swagger
 * à toutes les routes détectées dans les fichiers de routes
 */

const fs = require('fs');
const path = require('path');

// Fonction pour analyser un fichier de routes et extraire les routes
function analyzeRoutes(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const routes = [];

  // Regex pour détecter les routes Express
  const routeRegex = /router\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g;
  let match;

  while ((match = routeRegex.exec(content)) !== null) {
    const [, method, routePath] = match;
    routes.push({
      method: method.toLowerCase(),
      path: routePath,
      fullPath: `/api${routePath.replace('/api', '')}`
    });
  }

  return routes;
}

// Fonction pour générer la documentation @swagger de base
function generateSwaggerDoc(route, tagName, hasAuth = false) {
  const { method, fullPath } = route;

  let swaggerDoc = `/**
 * @swagger
 * ${fullPath}:
 *   ${method}:
 *     summary: "${method.toUpperCase()} ${fullPath}"
 *     tags: [${tagName}]`;

  if (hasAuth) {
    swaggerDoc += `
 *     security:
 *       - bearerAuth: []`;
  }

  // Détection automatique des paramètres
  if (fullPath.includes('/:') || fullPath.includes('{')) {
    const paramMatches = fullPath.match(/:(\w+)|\{(\w+)\}/g);
    if (paramMatches) {
      swaggerDoc += `
 *     parameters:`;
      paramMatches.forEach(param => {
        const paramName = param.replace(/[:{}]/g, '');
        swaggerDoc += `
 *       - in: path
 *         name: ${paramName}
 *         required: true
 *         schema:
 *           type: string
 *         description: "${paramName}"`;
      });
    }
  }

  // Réponse de base
  swaggerDoc += `
 *     responses:
 *       200:
 *         description: "Succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Opération réussie"
 *                 data:
 *                   type: object
 *                   description: "Données de réponse"
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non authentifié"
 *       500:
 *         description: "Erreur serveur"
 */`;

  return swaggerDoc;
}

// Fichiers à traiter avec leurs configurations
const filesToProcess = [
  {
    path: 'src/router/users/auth.router.ts',
    tag: 'Authentication',
    hasAuth: false // Certaines routes nécessitent auth, d'autres non
  },
  {
    path: 'src/router/conversation.router.ts',
    tag: 'Conversations',
    hasAuth: true
  },
  {
    path: 'src/router/payment.router.ts',
    tag: 'Payments',
    hasAuth: true
  },
  {
    path: 'src/router/favorite.router.ts',
    tag: 'Favorites',
    hasAuth: true
  },
  {
    path: 'src/router/notification.router.ts',
    tag: 'Notifications',
    hasAuth: true
  },
  {
    path: 'src/router/rating.router.ts',
    tag: 'Ratings',
    hasAuth: true
  },
  {
    path: 'src/router/users/oauth.router.ts',
    tag: 'OAuth',
    hasAuth: false
  },
  {
    path: 'src/router/users/users.router.ts',
    tag: 'Users',
    hasAuth: true
  },
  {
    path: 'src/router/farm.router.ts',
    tag: 'Farms',
    hasAuth: false
  }
];

console.log('🚀 Analyse et ajout automatique de la documentation @swagger...\n');

let totalRoutesAdded = 0;

for (const fileConfig of filesToProcess) {
  const filePath = path.join(__dirname, '..', fileConfig.path);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Fichier non trouvé: ${fileConfig.path}`);
    continue;
  }

  console.log(`📄 Traitement de ${fileConfig.path}`);
  const routes = analyzeRoutes(filePath);

  console.log(`   📊 ${routes.length} routes détectées`);

  let content = fs.readFileSync(filePath, 'utf8');
  let routesAdded = 0;

  for (const route of routes) {
    // Vérifier si la documentation @swagger existe déjà
    const swaggerExists = content.includes(`@swagger\n * ${route.fullPath}:`);

    if (!swaggerExists) {
      // Générer la documentation @swagger
      const swaggerDoc = generateSwaggerDoc(route, fileConfig.tag, fileConfig.hasAuth);

      // Trouver la ligne de route et insérer la documentation avant
      const routeLine = `router.${route.method}('${route.path}'`;
      const routeIndex = content.indexOf(routeLine);

      if (routeIndex !== -1) {
        // Insérer avant la ligne de route
        content = content.slice(0, routeIndex) + swaggerDoc + '\n' + content.slice(routeIndex);
        routesAdded++;
        console.log(`   ✅ Ajouté: ${route.method.toUpperCase()} ${route.fullPath}`);
      }
    }
  }

  if (routesAdded > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`   💾 ${routesAdded} routes documentées dans ${fileConfig.path}`);
    totalRoutesAdded += routesAdded;
  } else {
    console.log(`   ℹ️ Toutes les routes déjà documentées dans ${fileConfig.path}`);
  }

  console.log('');
}

console.log(`🎉 Documentation ajoutée pour ${totalRoutesAdded} routes au total`);
console.log('🔄 Régénération de la documentation Swagger...');

// Régénérer la documentation
require('./generate-swagger.js');
