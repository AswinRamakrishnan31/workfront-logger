import { Router } from 'express';
import dropdownController from '../controllers/dropdownController.js';
import authorize from '../middleware/authorize.js';

const router = Router();

router.get('/', dropdownController.getDropdowns);
router.post('/:category', authorize('Admin', 'Manager'), dropdownController.updateCategoryOptions);

export default router;
