import { Router } from 'express';
import authRoutes from './authRoutes.js';
import eventRoutes from './eventRoutes.js';
import landRoutes from './landRoutes.js';
import treeRoutes from './treeRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/lands', landRoutes);
router.use('/trees', treeRoutes);
router.use('/admin', adminRoutes);

export default router;
