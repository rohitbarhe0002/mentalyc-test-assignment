import express from 'express';
import authController from '../controllers/authController';
import userController from '../controllers/userContoller';
const router = express.Router();
router.post('/signup', userController.signUp)
router.post('/signin', authController.login);
router.get('/logout', authController.logout);


export default router;
