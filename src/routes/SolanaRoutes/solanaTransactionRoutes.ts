import express, { Router } from 'express';
import { authMiddleware, checkTokenBlacklist } from '../../middleware/auth';
import { sendSol, sendToken } from '../../controllers/SolanaController/solanaTransactionController';
const router = express.Router();


router.post('/send-sol', authMiddleware, checkTokenBlacklist, sendSol);
router.post('/send-token', authMiddleware, checkTokenBlacklist, sendToken);

export { router as solanaTransactionRouter };