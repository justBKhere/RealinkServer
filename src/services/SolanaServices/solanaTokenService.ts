import { Keypair, Transaction, sendAndConfirmTransaction, Connection } from "@solana/web3.js";
import { AirdropTokenShyft, BurnTokenShyft, CreateFungibleTokenShyft, MintFungibleTokenShyft } from "../../utils/Shyft/shyftApiService";
import { getPrivateKeyFromSession } from "./solanaTransactionService";
import { setSolanaCluster } from "./solanaWalletService";

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