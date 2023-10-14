import express from 'express';
import * as solanaWalletController from '../../controllers/SolanaController/solanaWalletController';
import { authMiddleware, checkTokenBlacklist } from '../../middleware/auth';

const router = express.Router();

router.post('/import-new-wallet', authMiddleware, checkTokenBlacklist, solanaWalletController.LoadWalletFromMnemonic);
router.post('/update-cluster', authMiddleware, checkTokenBlacklist, solanaWalletController.UpdateSolanaCluster);
router.get('/get-wallet-balances', authMiddleware, checkTokenBlacklist, solanaWalletController.getWalletBalances);
router.get('/get-default-portfolio', authMiddleware, checkTokenBlacklist, solanaWalletController.getDefaultPortfolio);
router.get('/get-portfolio-by-address', authMiddleware, checkTokenBlacklist, solanaWalletController.getPortfoliobyAddress);
router.get('/get-all-token-balances', authMiddleware, checkTokenBlacklist, solanaWalletController.getAllTokenBalances);
router.get('/get-all-NFTs', authMiddleware, checkTokenBlacklist, solanaWalletController.getAllCollections);
router.get('/get-all-domains', authMiddleware, checkTokenBlacklist, solanaWalletController.getAllDomains);
router.get('/get-all-transactions', authMiddleware, checkTokenBlacklist, solanaWalletController.getAllTransactions);
router.get('/get-all-cNFTs', authMiddleware, checkTokenBlacklist, solanaWalletController.getAllcNFTS);
export { router as solWalletRouter };
