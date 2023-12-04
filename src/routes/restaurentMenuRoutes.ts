import express from 'express';
import RestaurentMenuController from '../controllers/RestaurentMenuController';
import authenticateUser from '../middleware/authMiddleware';

const router = express.Router();

router.post('/',authenticateUser, RestaurentMenuController.createRestaurentMenu);
router.get('/', RestaurentMenuController.getAllRestaurentMenu);
router.get('/:id',RestaurentMenuController.getRestaurentMenuById);
router.put('/:id', authenticateUser, RestaurentMenuController.updateRestaurentMenu);
router.delete('/:id', authenticateUser, RestaurentMenuController.deleteRestaurentMenu);

export default router;
