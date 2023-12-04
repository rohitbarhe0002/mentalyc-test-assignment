import express from 'express';
import orderController from '../controllers/OrderController';
import authenticateUser from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', orderController.createOrder);
router.get('/', orderController.getAllOrder);
router.get('/:id',orderController.getOrderById);
router.put('/:id', authenticateUser, orderController.updateOrder);
router.delete('/:id', authenticateUser, orderController.deleteOrder);

export default router;
