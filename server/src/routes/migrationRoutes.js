import { Router } from 'express';
import migrationController from '../controllers/migrationController.js';

const router = Router();

router.post('/local-storage', migrationController.migrateLocalStorage);

export default router;
