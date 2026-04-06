import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken, requireRole('Admin'));

router.get('/dashboard', adminController.dashboard);
router.get('/users', adminController.users);
router.put('/users/:id', adminController.updateUser);
router.get('/reports', adminController.reports);

export default router;
