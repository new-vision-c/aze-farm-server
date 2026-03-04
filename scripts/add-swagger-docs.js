/**
 * Script pour ajouter la documentation @swagger aux routes
 */

const fs = require('fs');
const path = require('path');

// Fonction pour ajouter la documentation @swagger
function addSwaggerDoc(filePath, routePath, method, summary, tags = ['Public'], hasAuth = false, inputSchema = null, outputSchema = null, errors = null) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Recherche de la ligne de route
  const routeRegex = new RegExp(`router\\.${method}\\('${routePath.replace('/api', '')}'`, 'g');
  const match = content.match(routeRegex);

  if (!match) {
    console.log(`⚠️ Route non trouvée: ${method.toUpperCase()} ${routePath} dans ${filePath}`);
    return false;
  }

  let swaggerComment = `/**
 * @swagger
 * ${routePath}:
 *   ${method}:
 *     summary: "${summary}"
 *     tags: [${tags.join(', ')}]`;

  if (hasAuth) {
    swaggerComment += `
 *     security:
 *       - bearerAuth: []`;
  }

  if (inputSchema) {
    swaggerComment += `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
${inputSchema.split('\n').map(line => ` *               ${line}`).join('\n')}`;
  }

  if (outputSchema) {
    swaggerComment += `
 *     responses:
 *       200:
 *         description: "Succès"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
${outputSchema.split('\n').map(line => ` *                 ${line}`).join('\n')}`;
  } else {
    swaggerComment += `
 *     responses:
 *       200:
 *         description: "Succès"`;
  }

  if (errors) {
    swaggerComment += '\n' + errors.split('\n').map(line => ` * ${line}`).join('\n');
  }

  swaggerComment += '\n */';

  // Insérer le commentaire avant la route
  const routeLine = match[0];
  const updatedContent = content.replace(routeLine, swaggerComment + '\n' + routeLine);

  fs.writeFileSync(filePath, updatedContent, 'utf8');
  return true;
}

// Liste des routes à documenter
const routesToAdd = [
  // Auth routes
  {
    file: 'src/router/users/auth.router.ts',
    route: '/api/auth/register',
    method: 'post',
    summary: 'Inscription utilisateur',
    tags: ['Authentication'],
    inputSchema: `email:\n  type: string\n  format: email\npassword:\n  type: string\n  minLength: 6\nfullname:\n  type: string\n  minLength: 3\nprofile:\n  type: string\n  format: binary`,
    outputSchema: `success:\n  type: boolean\nmessage:\n  type: string\ndata:\n  type: object\n  properties:\n    step:\n      type: integer\n    user:\n      type: object\n    token:\n      type: string\n    requiresOtp:\n      type: boolean`,
    errors: `400:\n  description: "Email déjà utilisé"\n500:\n  description: "Erreur serveur"`
  },
  // Ajouter d'autres routes...
];

console.log('🚀 Ajout de la documentation @swagger...\n');

let addedCount = 0;
for (const route of routesToAdd) {
  const filePath = path.join(__dirname, '..', route.file);
  if (fs.existsSync(filePath)) {
    if (addSwaggerDoc(filePath, route.route, route.method, route.summary, route.tags, route.hasAuth, route.inputSchema, route.outputSchema, route.errors)) {
      addedCount++;
      console.log(`✅ Ajouté: ${route.method.toUpperCase()} ${route.route}`);
    }
  }
}

console.log(`\n✅ ${addedCount} routes documentées`);
console.log('🔄 Régénération de la documentation...');

// Régénérer la documentation
require('./generate-swagger.js');
