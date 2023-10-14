
import { Request, Response } from 'express';
import { airdropTokenService, burnTokenService, createTokenService, mintTokenService, createMerkleeTreeService, mintCompressedNFTService } from '../../services/SolanaServices/solanaTokenService';
import { Console } from 'console';

export const createFungibleToken = async (req: Request, res: Response) => {
    try {
        //console.log("req.body", req);
        const requestParam: any = req;
        const userId = requestParam.user.id;
        const fileData = req.file;

        if (!fileData) {
            throw new Error("File was not provided.");
        }
        const transactionId = await createTokenService(req.body, fileData, req.headers.authorization!, userId);
        res.status(200).json({ message: "Transaction sent successfully", transactionId });
    }
    catch (error: any) {
        console.error(`Error creating fungible token: ${error.message}`);
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        res.status(error.statusCode).json({ error: error.message });
    }
}

export const mintFungibleToken = async (req: Request, res: Response) => {
    try {
        console.log("req.body", req);
        const requestParam: any = req;
        const userId = requestParam.user.id;

        const transactionId = await mintTokenService(req.body, req.headers.authorization!, userId);
        res.status(200).json({ message: "Transaction sent successfully", transactionId });
    }
    catch (error: any) {

        console.error(`Error minting fungible token: ${error.message}`);
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        res.status(error.statusCode).json({ error: error.message });
    }
}

export const burnFungibleToken = async (req: Request, res: Response) => {
    try {
        console.log("req.body", req);
        const requestParam: any = req;
        const userId = requestParam.user.id;

        const transactionId = await burnTokenService(req.body, req.headers.authorization!, userId);
        res.status(200).json({ message: "Transaction sent successfully", transactionId });
    }
    catch (error: any) {

        console.error(`Error burning fungible token: ${error.message}`);
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        res.status(error.statusCode).json({ error: error.message });
    }
}

export const airdropFungibleToken = async (req: Request, res: Response) => {
    try {
        console.log("req.body", req);
        const requestParam: any = req;
        const userId = requestParam.user.id;

        const transactionId = await airdropTokenService(req.body, req.headers.authorization!, userId);
        res.status(200).json({ message: "Transaction sent successfully", transactionId });
    }
    catch (error: any) {

        console.error(`Error airdropping token: ${error.message}`);
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        res.status(error.statusCode).json({ error: error.message });
    }
}

export const createMerkleeTree = async (req: Request, res: Response) => {
    try {
        console.log("req.body", req);
        const requestParam: any = req;
        const userId = requestParam.user.id;

        const transactionId = await createMerkleeTreeService(req.body, req.headers.authorization!, userId);
        res.status(200).json({ message: "Merklee tree successfully created", transactionId })
    }
    catch (error: any) {

        console.error(`Error creating tree: ${error.message}`);
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        res.status(error.statusCode).json({ error: error.message });
    }
}

export const mintcNFTToUser = async (req: Request, res: Response) => {
    try {
        console.log("req.body", req);
        const requestParam: any = req;
        const userId = requestParam.user.id;

        const transactionId = await mintCompressedNFTService(req.body, req.headers.authorization!);
        res.status(200).json({ message: "Transaction sent successfully", transactionId });
    }
    catch (error: any) {

        console.error(`Error creating tree: ${error.message}`);
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        res.status(error.statusCode).json({ error: error.message });
    }
}

