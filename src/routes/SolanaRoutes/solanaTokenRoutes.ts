import express, { Router } from 'express';
import { authMiddleware, checkTokenBlacklist } from '../../middleware/auth';
import { sendSol, sendToken } from '../../controllers/SolanaController/solanaTransactionController';
import { airdropFungibleToken, burnFungibleToken, createFungibleToken, mintFungibleToken } from '../../controllers/SolanaController/solanaTokenController';
import multer from 'multer';


const data = multer({ storage: multer.memoryStorage() });
const router = express.Router();


router.post('/create-token', authMiddleware, checkTokenBlacklist, data.single('file'), createFungibleToken);
router.post('/mint-token', authMiddleware, checkTokenBlacklist, mintFungibleToken);
router.delete('/burn-token', authMiddleware, checkTokenBlacklist, burnFungibleToken);
router.post('/airdrop-token', authMiddleware, checkTokenBlacklist, airdropFungibleToken);


export { router as solanaTokenRouter };