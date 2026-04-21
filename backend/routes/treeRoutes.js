import { Router } from 'express';
import * as treeController from '../controllers/treeController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticateToken, treeController.create);
router.post('/historical', authenticateToken, treeController.createHistorical);
router.get('/', authenticateToken, treeController.getAll);
router.get('/mine', authenticateToken, treeController.getMine);
router.get('/:id', authenticateToken, treeController.getById);
router.post('/:id/task', authenticateToken, treeController.addTask);
router.put('/:id/health', authenticateToken, treeController.updateHealth);
router.delete('/:id', authenticateToken, treeController.remove);

export default router;
