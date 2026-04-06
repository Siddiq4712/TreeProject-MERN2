import { Router } from 'express';
import * as landController from '../controllers/landController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticateToken, landController.create);
router.get('/', authenticateToken, landController.getAll);
router.get('/mine', authenticateToken, landController.getMine);
router.get('/:id', authenticateToken, landController.getById);
router.get('/:id/detail', authenticateToken, landController.getDetail);
router.put('/:id', authenticateToken, landController.update);
router.delete('/:id', authenticateToken, landController.remove);
router.post('/:id/photo', authenticateToken, landController.addPhoto);

export default router;