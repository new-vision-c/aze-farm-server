const yaml = require('yamljs');
const fs = require('fs');

// Charger le fichier OpenAPI généré
const openapiPath = './docs/openapi.yaml';
if (fs.existsSync(openapiPath)) {
  const swaggerDocument = yaml.load(openapiPath);
  console.log('✅ Fichier OpenAPI chargé avec succès');
  console.log(`📊 Stats:`);
  console.log(`   - Paths: ${Object.keys(swaggerDocument.paths || {}).length}`);
  console.log(`   - Schemas: ${Object.keys(swaggerDocument.components?.schemas || {}).length}`);
  console.log(`   - Parameters: ${Object.keys(swaggerDocument.components?.parameters || {}).length}`);
  console.log(`   - Responses: ${Object.keys(swaggerDocument.components?.responses || {}).length}`);
  
  // Afficher les premiers paths
  const paths = Object.keys(swaggerDocument.paths || {});
  if (paths.length > 0) {
    console.log('\n🔍 Premiers paths trouvés:');
    paths.slice(0, 5).forEach(path => {
      console.log(`   - ${path}`);
    });
  }
} else {
  console.error('❌ Fichier OpenAPI non trouvé');
}
