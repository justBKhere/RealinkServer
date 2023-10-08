// src/routes/userRoutes.ts
import express, { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import GameController from '../../controllers/GameController/gameController';

const router: Router = express.Router();

// Register a new user
router.post('/item-pickup', authMiddleware, GameController.HandleItemPickup);

router.post('/build-using-tokens', authMiddleware, GameController.BuildUsingTokens);

//router.post('/build-a-battle-bot', authMiddleware, GameController.BuildABattleBot);

//router.post('/build-a-helper-bot', authMiddleware, GameController.BuildAHelperBot);


router.post('/')
export { router as gameApiRouter };
