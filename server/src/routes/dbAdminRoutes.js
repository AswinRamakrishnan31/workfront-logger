import { Router } from 'express';
import dbAdminController from '../controllers/dbAdminController.js';
import authorize from '../middleware/authorize.js';

const router = Router();

router.get('/storage-stats', authorize('Admin'), dbAdminController.getStorageStats);
router.get('/backups', authorize('Admin'), dbAdminController.getBackups);
router.post('/backups', authorize('Admin'), dbAdminController.createBackup);
router.post('/restore', authorize('Admin'), dbAdminController.restoreBackup);
router.get('/archives', authorize('Admin'), dbAdminController.getArchives);
router.post('/archive', authorize('Admin'), dbAdminController.archiveData);

export default router;
