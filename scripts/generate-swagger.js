/**
 * Script de génération de la documentation OpenAPI/Swagger
 * Génère le fichier docs/openapi.yaml depuis les commentaires @swagger
 */

const fs = require('fs');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const yaml = require('yamljs');

// Configuration swagger-jsdoc
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AZE FARM API',
      version: '1.0.0',
      description: 'API pour la gestion des produits agricoles',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Serveur de développement',
      },
    ],
  },
  apis: ['./src/controllers/**/*.ts', './src/router/**/*.ts', './src/router/users/*.ts'],
};

try {
  // Générer la spécification OpenAPI
  const openapiSpecification = swaggerJsdoc(options);

  // Vérifier si la génération a réussi
  if (!openapiSpecification || Object.keys(openapiSpecification).length === 0) {
    console.error('❌ Erreur: La spécification OpenAPI est vide');
    process.exit(1);
  }

  // Convertir en YAML
  const yamlString = yaml.stringify(openapiSpecification, 10, 2);

  // Écrire le fichier
  const outputPath = path.join(__dirname, '../docs/openapi.yaml');
  fs.writeFileSync(outputPath, yamlString, 'utf8');

  console.log('✅ Documentation OpenAPI générée avec succès !');
  console.log(`📄 Fichier: ${outputPath}`);
  console.log(`📊 Routes documentées: ${Object.keys(openapiSpecification.paths || {}).length}`);

  // Afficher un aperçu des routes
  if (openapiSpecification.paths && Object.keys(openapiSpecification.paths).length > 0) {
    console.log('\n📝 Routes détectées:');
    Object.keys(openapiSpecification.paths).forEach((route) => {
      const methods = Object.keys(openapiSpecification.paths[route]);
      console.log(`  ${route}: ${methods.join(', ')}`);
    });
  } else {
    console.log('\n⚠️ Aucune route détectée dans les fichiers scannés');
  }
} catch (error) {
  console.error('❌ Erreur lors de la génération:', error.message);
  console.error(error.stack);
  process.exit(1);
}
