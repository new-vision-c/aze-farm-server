import type { Express } from 'express';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';

/**
 * Sets up Swagger UI and OpenAPI documentation routes for the Express application.
 *
 * This function loads the OpenAPI specification from the generated YAML file
 * and configures Swagger UI with custom options.
 *
 * @param app - The Express application instance to which Swagger documentation routes will be attached.
 */
const setupSwagger = (app: Express) => {
  // Use absolute path to load the generated OpenAPI YAML file
  const openapiPath = path.resolve(__dirname, '../../../docs/openapi.yaml');

  if (!fs.existsSync(openapiPath)) {
    console.error(`OpenAPI file not found at: ${openapiPath}`);
    return;
  }

  // Load the OpenAPI specification from YAML file
  const swaggerDocument = yaml.load(openapiPath);

  // Custom Swagger UI options
  const optionsUI = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AZE FARM API Documentation',
    swaggerOptions: {
      defaultModelsExpandDepth: 2,
      docExpansion: 'list',
      persistAuthorization: true,
    },
  };

  // Swagger documentation route
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, optionsUI));

  // Generate openapi.json file
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerDocument);
  });
};

export default setupSwagger;
