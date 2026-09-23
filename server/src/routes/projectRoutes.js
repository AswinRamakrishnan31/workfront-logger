import { Router } from 'express';
import projectController from '../controllers/projectController.js';
import validate from '../middleware/validation.js';
import authorize from '../middleware/authorize.js';
import { projectSchema } from '../validators/schemaValidators.js';

const router = Router();

router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', authorize('Admin', 'Manager', 'PM', 'Lead', 'Developer'), validate(projectSchema), projectController.createProject);
router.put('/:id', authorize('Admin', 'Manager', 'PM', 'Lead', 'Developer'), validate(projectSchema), projectController.updateProject);
router.delete('/:id', authorize('Admin', 'Manager'), projectController.deleteProject);

export default router;
