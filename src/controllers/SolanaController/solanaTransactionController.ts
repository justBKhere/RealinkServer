// controllers/solanaController.ts

import { Request, Response } from 'express';
import { sendSolService, sendTokenService } from '../../services/SolanaServices/solanaTransactionService';

export const sendSol = async (req: Request, res: Response) => {
  try {
    const requestParam: any = req;
    const userId = requestParam.user.id;

    const transactionId = await sendSolService(req.body, req.headers.authorization!, userId);
    res.status(200).json({ message: "Transaction sent successfully", transactionId });
  } catch (error: any) {
    console.error(`Error sending SOL: ${error.message}`);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    res.status(error.statusCode).json({ error: error.message });
  }
};

export const sendToken = async (req: Request, res: Response) => {
  try {
    const requestParam: any = req;
    const userId = requestParam.user.id;

    const transactionId = await sendTokenService(req.body, req.headers.authorization!, userId);
    res.status(200).json({ message: "Transaction sent successfully", transactionId });
  } catch (error: any) {
    console.error(`Error sending Token: ${error.message}`);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    res.status(error.statusCode).json({ error: error.message });
  }
}
