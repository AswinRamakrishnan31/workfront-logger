import { Router } from 'express';
import reportController from '../controllers/reportController.js';

const router = Router();

router.get('/summary', reportController.getSummary);

export default router;
