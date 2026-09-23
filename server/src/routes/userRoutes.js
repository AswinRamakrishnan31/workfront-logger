import { Router } from 'express';
import userController from '../controllers/userController.js';
import authorize from '../middleware/authorize.js';

const router = Router();

router.get('/users', authorize('Admin', 'Manager'), userController.getUsers);
router.post('/users', authorize('Admin'), userController.createUser);
router.put('/users/:id', authorize('Admin'), userController.updateUser);
router.get('/audit-logs', authorize('Admin', 'Manager', 'PM', 'Lead'), userController.getAuditLogs);

export default router;
