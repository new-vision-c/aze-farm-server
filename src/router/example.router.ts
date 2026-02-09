import { Router } from 'express';

import { ExampleController } from '../controllers/example.controller';

const router = Router();
const exampleController = new ExampleController();

/**
 * Routes de test pour l'internationalisation
 */
router.get('/test', exampleController.testI18n);
router.get('/error', exampleController.testError);
router.get('/params', exampleController.testParams);
router.get('/validation', exampleController.testValidation);
router.get('/pagination', exampleController.testPagination);

export default router;
