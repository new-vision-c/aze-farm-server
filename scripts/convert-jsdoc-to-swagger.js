/**
 * Script de conversion des commentaires JSDoc vers @swagger
 * Convertit les commentaires @route, @input, @output vers le format @swagger YAML
 */

const fs = require('fs');
const path = require('path');

// Fonction pour convertir un commentaire JSDoc vers @swagger
function convertJSDocToSwagger(jsdocComment) {
  const lines = jsdocComment.split('\n').map((line) => line.trim().replace(/^\*\s*/, ''));

  let method = '';
  let route = '';
  let description = '';
  let access = 'Public';
  let hasInput = false;
  let hasOutput = false;
  let inputProperties = [];
  let outputProperties = [];
  let errorResponses = [];

  for (const line of lines) {
    if (line.startsWith('@route')) {
      const match = line.match(/@route\s+(\w+)\s+(.+)/);
      if (match) {
        method = match[1].toLowerCase();
        route = match[2].replace('/api', '');
      }
    } else if (line.startsWith('@desc')) {
      description = line.replace('@desc', '').trim();
    } else if (line.startsWith('@access')) {
      access = line.replace('@access', '').trim();
    } else if (line.startsWith('@input')) {
      hasInput = true;
      const inputMatch = line.match(/@input\s+\{([^}]+)\}\s+(.+)/);
      if (inputMatch) {
        const [, type, field] = inputMatch;
        const fieldName = field.split(' - ')[0];
        inputProperties.push(
          `              ${fieldName}:\n                type: ${type.toLowerCase()}`,
        );
      }
    } else if (line.startsWith('@output')) {
      hasOutput = true;
      const outputMatch = line.match(/@output\s+\{([^}]+)\}\s+(.+)/);
      if (outputMatch) {
        const [, type, field] = outputMatch;
        const fieldName = field.split(' - ')[0];
        outputProperties.push(
          `                ${fieldName}:\n                  type: ${type.toLowerCase()}`,
        );
      }
    } else if (line.startsWith('@error')) {
      const errorMatch = line.match(/@error\s+(\d+)\s+\{(.+)\}/);
      if (errorMatch) {
        const [, code, message] = errorMatch;
        errorResponses.push(`      ${code}:\n        description: "${message}"`);
      }
    }
  }

  // Générer le YAML Swagger avec une indentation correcte
  let swaggerYaml = `
/api${route}:
  ${method}:
    summary: "${description}"
    tags: [${access === 'Private' ? 'Authentication' : 'Public'}]`;

  if (access === 'Private') {
    swaggerYaml += `
    security:
      - bearerAuth: []`;
  }

  if (hasInput && inputProperties.length > 0) {
    swaggerYaml += `
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
${inputProperties.join('\n')}`;
  }

  swaggerYaml += `
    responses:
      200:
        description: "Succès"
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                message:
                  type: string
                data:
                  type: object
                  properties:
${outputProperties.join('\n')}`;

  if (errorResponses.length > 0) {
    swaggerYaml += '\n' + errorResponses.join('\n');
  }

  return swaggerYaml.trim();
}

// Fonction principale pour traiter un fichier
function processFile(filePath) {
  console.log(`🔄 Traitement de ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf8');
  let updatedContent = content;

  // Regex pour trouver les blocs JSDoc avec @route
  const jsdocRegex = /\/\*\*\s*\n(?:\s*\*\s*@route[\s\S]*?)\s*\*\//g;

  let match;
  while ((match = jsdocRegex.exec(content)) !== null) {
    const jsdocComment = match[0];
    if (jsdocComment.includes('@route')) {
      const swaggerYaml = convertJSDocToSwagger(jsdocComment);

      // Remplacer le commentaire JSDoc par un commentaire @swagger
      const swaggerComment = `/**
 * @swagger${swaggerYaml}
 */`;

      updatedContent = updatedContent.replace(jsdocComment, swaggerComment);
    }
  }

  if (updatedContent !== content) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`✅ ${filePath} mis à jour`);
    return true;
  }

  return false;
}

// Fichiers à traiter
const filesToProcess = [
  'src/router/users/auth.router.ts',
  'src/router/conversation.router.ts',
  'src/router/payment.router.ts',
  'src/router/favorite.router.ts',
  'src/router/notification.router.ts',
  'src/router/rating.router.ts',
  'src/router/users/oauth.router.ts',
  'src/router/users/users.router.ts',
  'src/router/farm.router.ts',
];

console.log('🚀 Début de la conversion JSDoc vers @swagger...\n');

let processedCount = 0;
for (const file of filesToProcess) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    if (processFile(filePath)) {
      processedCount++;
    }
  } else {
    console.log(`⚠️ Fichier non trouvé: ${file}`);
  }
}

console.log(`\n✅ Conversion terminée: ${processedCount} fichiers traités`);
console.log('🔄 Régénération de la documentation Swagger...');

// Régénérer la documentation
require('./generate-swagger.js');
