import { Router } from 'express';
import integrationController from '../controllers/integrationController.js';
import authorize from '../middleware/authorize.js';

const router = Router();

router.get('/', authorize('Admin', 'Manager'), integrationController.getConfigs);
router.post('/config', authorize('Admin'), integrationController.saveConfig);
router.post('/sync', authorize('Admin', 'Manager'), integrationController.triggerSync);

export default router;
