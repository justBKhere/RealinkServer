import { Keypair, Transaction, sendAndConfirmTransaction, Connection } from "@solana/web3.js";
import { AirdropTokenShyft, BurnTokenShyft, CreateFungibleTokenShyft, MintFungibleTokenShyft, createMerkleTree } from "../../utils/Shyft/shyftApiService";
import { getPrivateKeyFromSession } from "./solanaTransactionService";
import { setSolanaCluster } from "./solanaWalletService";
import { body } from "express-validator";
import { partialSignTransactionWithPrivateKeys, restApiCall } from "@shyft-to/js/dist/cjs/utils";
import { base58ToUint8Array, uint8ArrayToBase58 } from "../../utils/base58Utils";
import { getWalletAddressesByUserId } from "./solanaWalletService";

import dotenv from 'dotenv';
dotenv.config();


const signAndSendTransaction = async (encodedTransaction: string, ownerKeypair: Keypair, network: string) => {
    const transaction = Transaction.from(Buffer.from(encodedTransaction, 'base64'));
    const connection = new Connection(setSolanaCluster(network));

    if (!transaction.feePayer) {
        transaction.feePayer = ownerKeypair.publicKey;
    }

    transaction.partialSign(ownerKeypair);

    const balance = await connection.getBalance(ownerKeypair.publicKey);
    if (balance === 0) {
        throw new Error("Insufficient SOL to pay for the transaction.");
    }

    const signature = await sendAndConfirmTransaction(connection, transaction, [ownerKeypair]);
    return `https://explorer.solana.com/tx/${signature}`;
};

export const createTokenService = async (body: any, file: any, jwtToken: string, userId: string): Promise<string> => {
    try {
        const { wallet, name, symbol, description, decimals, network } = body;
        const result = await CreateFungibleTokenShyft(wallet, name, symbol, description, Number(decimals), file, network);

        const ownerPrivateKey = await getPrivateKeyFromSession(userId, wallet, jwtToken);
        const ownerKeypair = Keypair.fromSecretKey(ownerPrivateKey);

        return await signAndSendTransaction(result.result.encoded_transaction, ownerKeypair, network);
    } catch (error) {
        console.error("Error in createTokenService:", error);
        throw new Error("Failed to create token due to an internal error.");
    }
};

export const mintTokenService = async (body: any, jwtToken: string, userId: string) => {
    const { mintAuthority, tokenAddress, receiverAddress, amount, message, network } = body;
    const response = await MintFungibleTokenShyft(mintAuthority, receiverAddress, tokenAddress, amount, message, network);

    const ownerPrivateKey = await getPrivateKeyFromSession(userId, mintAuthority, jwtToken);
    const ownerKeypair = Keypair.fromSecretKey(ownerPrivateKey);

    return await signAndSendTransaction(response.encoded_transaction, ownerKeypair, network);
};

export const burnTokenService = async (body: any, jwtToken: string, userId: string) => {
    const { walletAddress, tokenAddress, amount, network } = body;
    const response: any = await BurnTokenShyft(walletAddress, tokenAddress, amount, network);

    const ownerPrivateKey = await getPrivateKeyFromSession(userId, walletAddress, jwtToken);
    const ownerKeypair = Keypair.fromSecretKey(ownerPrivateKey);

    return await signAndSendTransaction(response.encoded_transaction, ownerKeypair, network);
};

export const airdropTokenService = async (body: any, jwtToken: string, userId: string) => {
    const { walletAddress, tokenAddress, transferInfo, network } = body;
    const response: any = await AirdropTokenShyft(walletAddress, tokenAddress, transferInfo, network);
    console.log("response", response);
    const ownerPrivateKey = await getPrivateKeyFromSession(userId, walletAddress, jwtToken);
    const ownerKeypair = Keypair.fromSecretKey(ownerPrivateKey);

    return await signAndSendTransaction(response.encoded_transaction, ownerKeypair, network);
}
export const createMerkleeTreeService = async (body: any, jwtToken: string, userId: string) => {
    console.log('createMerkleeTreeService started');  // Log when the function starts

    const { walletAddress, network } = body;
    const connection = new Connection(setSolanaCluster(network));
    let resolvedWalletAddress: string;

    if (!process.env.GAME_SERVER_PRIVATE_KEY) {
        console.log('GAME_SERVER_PRIVATE_KEY not found in environment variables');  // Log when the env variable is missing
        return;
    }

    const serverKeyPair = Keypair.fromSecretKey(base58ToUint8Array(process.env.GAME_SERVER_PRIVATE_KEY));

    if (walletAddress === "default") {
        const walletDetails = await getWalletAddressesByUserId(userId);
        resolvedWalletAddress = walletDetails[0]?.publicKey;

        if (!resolvedWalletAddress) {
            console.log({ message: 'No default wallet found for the user.' });
        }
    } else {
        resolvedWalletAddress = walletAddress;
    }

    console.log("public key of wallet address", resolvedWalletAddress);  // Log the resolved wallet address



    const ownerPrivateKey = await getPrivateKeyFromSession(userId, resolvedWalletAddress, jwtToken);
    console.log('Retrieved owner private key from session');  // Log when the private key is retrieved
    const ownerKeypair = Keypair.fromSecretKey(ownerPrivateKey);
    console.log("OWNER PUBLIC KEY", ownerKeypair.publicKey.toString());
    console.log("OWNER PRIVATE KEY", ownerPrivateKey);
    const response: any = await createMerkleTree(serverKeyPair.publicKey.toString(), network);
    console.log("response from createMerkleTree", response);  // Log the response from createMerkleTree



    const signedTx = await partialSignTransactionWithPrivateKeys(response.encoded_transaction, [uint8ArrayToBase58(serverKeyPair.secretKey)]);
    console.log('Transaction partially signed with owner private key', signedTx);  // Log when the transaction is partially signed


    const confirmedTx = await connection.sendRawTransaction(signedTx.serialize());
    return confirmedTx;
}
