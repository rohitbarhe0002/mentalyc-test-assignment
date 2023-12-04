
import express from 'express';
import userController from '../controllers/userContoller';
import authenticateUser from '../middleware/authMiddleware';

const router = express.Router();

router.post('/signup',userController.signUp); 
router.get('/',userController.getAllUsers); 
router.get('/:id',authenticateUser,userController.getUserById);
router.put('/:id', authenticateUser, userController.updateUser);
router.delete('/:id', authenticateUser, userController.deleteUser);




export default router;
