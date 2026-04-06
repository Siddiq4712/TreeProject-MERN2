import { Router } from 'express';
import * as eventController from '../controllers/eventController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Event CRUD
router.post('/', authenticateToken, eventController.create);
router.get('/', authenticateToken, eventController.getAll);
router.get('/my-created', authenticateToken, eventController.getMyCreated);

// DETAIL ROUTE
router.get('/:id/detail', authenticateToken, eventController.getDetail);

// Generic ID-based routes
router.get('/:id', authenticateToken, eventController.getById);
router.put('/:id', authenticateToken, eventController.update);
router.delete('/:id', authenticateToken, eventController.remove);

// Resources
router.get('/:id/resources', authenticateToken, eventController.getResources);

// Join Request
router.post('/:id/join', authenticateToken, eventController.join);
router.get('/:id/my-status', authenticateToken, eventController.getMyRequestStatus);

// Request Management (for creators)
router.get('/:id/requests', authenticateToken, eventController.getRequests);
router.post('/requests/:requestId/accept', authenticateToken, eventController.acceptRequest);
router.post('/requests/:requestId/reject', authenticateToken, eventController.rejectRequest);

// Phase Management
router.post('/:id/advance', authenticateToken, eventController.advancePhase);

export default router;
