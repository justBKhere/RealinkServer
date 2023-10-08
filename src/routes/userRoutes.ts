import express from 'express';
import * as UserController from '../controllers/userController';
import { authMiddleware, checkTokenBlacklist } from '../middleware/auth';

const router = express.Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/resetpassword', UserController.resetPassword);
router.put('/updatepassword', authMiddleware, checkTokenBlacklist, UserController.update);
router.delete('/delete', authMiddleware, checkTokenBlacklist, UserController.deleteUser);
router.post('/logout', authMiddleware, checkTokenBlacklist, UserController.logout);
router.get('/getuser', authMiddleware, checkTokenBlacklist, UserController.getUser);
router.post('/get-mnemonics', authMiddleware, checkTokenBlacklist, UserController.getMnemonics);
export { router as authRouter };
