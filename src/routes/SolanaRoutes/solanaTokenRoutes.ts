import express, { Router } from 'express';
import { authMiddleware, checkTokenBlacklist } from '../../middleware/auth';
import { sendSol, sendToken } from '../../controllers/SolanaController/solanaTransactionController';
import { airdropFungibleToken, burnFungibleToken, createFungibleToken, mintFungibleToken, createMerkleeTree, mintcNFTToUser } from '../../controllers/SolanaController/solanaTokenController';
import multer from 'multer';


const data = multer({ storage: multer.memoryStorage() });
const router = express.Router();


router.post('/create-token', authMiddleware, checkTokenBlacklist, data.single('file'), createFungibleToken);
router.post('/mint-token', authMiddleware, checkTokenBlacklist, mintFungibleToken);
router.delete('/burn-token', authMiddleware, checkTokenBlacklist, burnFungibleToken);
router.post('/airdrop-token', authMiddleware, checkTokenBlacklist, airdropFungibleToken);


router.post('/create-merklee-tree', authMiddleware, checkTokenBlacklist, createMerkleeTree);
router.post('/mint-cnft-to-user', authMiddleware, checkTokenBlacklist, mintcNFTToUser);

export { router as solanaTokenRouter };