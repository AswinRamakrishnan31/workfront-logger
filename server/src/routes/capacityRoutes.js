import { Router } from 'express';
import capacityController from '../controllers/capacityController.js';

const router = Router();

router.get('/monthly', capacityController.getMonthlyCapacity);

export default router;
