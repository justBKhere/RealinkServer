import { Keypair, Transaction, sendAndConfirmTransaction, Connection } from "@solana/web3.js";
import { AirdropTokenShyft, BurnTokenShyft, CreateFungibleTokenShyft, MintFungibleTokenShyft, createMerkleTree, MintCNftShyft, MintCNftShyftAirdrop } from "../../utils/Shyft/shyftApiService";
import { getPrivateKeyFromSession } from "./solanaTransactionService";
import { setSolanaCluster } from "./solanaWalletService";
import { body } from "express-validator";
import { partialSignTransactionWithPrivateKeys, restApiCall } from "@shyft-to/js/dist/cjs/utils";
import { base58ToUint8Array, uint8ArrayToBase58 } from "../../utils/base58Utils";
import { getWalletAddressesByUserId } from "./solanaWalletService";

import dotenv from 'dotenv';
import { User } from "../../models/User";
import { getAllcNFTS } from "../../controllers/SolanaController/solanaWalletController";
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
    const response: any = await createMerkleTree(serverKeyPair.publicKey.toString(), ownerKeypair.publicKey.toString(), network);
    console.log("response from createMerkleTree", response);  // Log the response from createMerkleTree


    const signedTx = await partialSignTransactionWithPrivateKeys(response.encoded_transaction, [uint8ArrayToBase58(ownerKeypair.secretKey), uint8ArrayToBase58(serverKeyPair.secretKey)]);
    console.log('Transaction partially signed with owner private key', signedTx);  // Log when the transaction is partially signed


    const confirmedTx = await connection.sendRawTransaction(signedTx.serialize());
    return { transaction: confirmedTx, merkleeTree: response.tree };
}

export const mintCompressedNFTService = async (body: any, jwtToken: string,) => {
    console.log('[mintCompressedNFTService] - Start');

    const { walletAddress, metaData, merkleTree, username, network } = body;
    console.log(`[mintCompressedNFTService] - Received parameters: walletAddress=${walletAddress}, username=${username}, network=${network}, metaData=${metaData}, merkleTree=${merkleTree}`);
    console.log("username", username);
    const user = await User.findOne({ username });
    console.log(`[mintCompressedNFTService] - userdata: ${user}`);
    const userId = user?._id.toString();
    console.log(`[mintCompressedNFTService] - Found user with ID: ${userId}`);

    const connection = new Connection(setSolanaCluster(network), 'processed');

    if (!process.env.GAME_SERVER_PRIVATE_KEY) {
        console.error('[mintCompressedNFTService] - GAME_SERVER_PRIVATE_KEY not found in environment variables');
        return;
    }

    const serverKeyPair = Keypair.fromSecretKey(base58ToUint8Array(process.env.GAME_SERVER_PRIVATE_KEY));

    let resolvedWalletAddress: string;
    if (walletAddress === "default") {
        const walletDetails = await getWalletAddressesByUserId(userId);
        resolvedWalletAddress = walletDetails[0]?.publicKey;

        if (!resolvedWalletAddress) {
            console.warn('[mintCompressedNFTService] - No default wallet found for the user.');
        }
    } else {
        resolvedWalletAddress = walletAddress;
    }
    console.log(`[mintCompressedNFTService] - Resolved wallet address: ${resolvedWalletAddress}`);

    const ownerPrivateKey = await getPrivateKeyFromSession(userId, resolvedWalletAddress, jwtToken);
    console.log('[mintCompressedNFTService] - Retrieved owner private key from session');

    const ownerKeypair = Keypair.fromSecretKey(ownerPrivateKey);
    console.log(`[mintCompressedNFTService] - OWNER PUBLIC KEY: ${ownerKeypair.publicKey.toString()}`);

    // Adding a 2-second delay before minting cNFT
    await new Promise(resolve => setTimeout(resolve, 2000));

    const response: any = await MintCNftShyft(serverKeyPair, ownerKeypair, metaData, merkleTree, resolvedWalletAddress, network);
    console.log(`[mintCompressedNFTService] - Response from MintCNftShyft: ${JSON.stringify(response)}`);

    const signedTx = await partialSignTransactionWithPrivateKeys(response.encoded_transaction, [uint8ArrayToBase58(serverKeyPair.secretKey), uint8ArrayToBase58(ownerKeypair.secretKey)]);
    console.log('[mintCompressedNFTService] - Transaction partially signed');

    const confirmedTx = await connection.sendRawTransaction(signedTx.serialize());
    console.log(`[mintCompressedNFTService] - Transaction confirmed: ${JSON.stringify(confirmedTx)}`);

    console.log('[mintCompressedNFTService] - End');
    return {
        transaction: confirmedTx,
        mintAddress: response.mint
    }
}

export const airdropCompressedNFTService = async (body: any, jwtToken: string, userId: string) => {
    console.log('[airdropCompressedNFTService] - Start');

    const { walletAddress, metaData, merkleTree, username, network } = body;
    console.log(`[airdropCompressedNFTService] - Received parameters: walletAddress=${walletAddress}, username=${username}, network=${network}, metaData=${metaData}, merkleTree=${merkleTree}`);

    const airdropuser = await User.findOne({ username });
    if (!airdropuser) {
        console.error('[airdropCompressedNFTService] - User not found for username:', username);
        throw new Error('User not found');
    }
    const airdropuserId = airdropuser._id.toString();
    console.log(`[airdropCompressedNFTService] - Found user with ID: ${airdropuserId}`);

    const connection = new Connection(setSolanaCluster(network));

    if (!process.env.GAME_SERVER_PRIVATE_KEY) {
        console.error('[airdropCompressedNFTService] - GAME_SERVER_PRIVATE_KEY not found in environment variables');
        throw new Error('GAME_SERVER_PRIVATE_KEY not found in environment variables');
    }

    const serverKeyPair = Keypair.fromSecretKey(base58ToUint8Array(process.env.GAME_SERVER_PRIVATE_KEY));

    let airdropuserresolvedWalletAddress: string;
    if (walletAddress === "default") {
        const walletDetails = await getWalletAddressesByUserId(airdropuserId);
        airdropuserresolvedWalletAddress = walletDetails[0]?.publicKey;

        if (!airdropuserresolvedWalletAddress) {
            console.warn('[airdropCompressedNFTService] - No default wallet found for the airdrop user.');
        }
    } else {
        airdropuserresolvedWalletAddress = walletAddress;
    }
    console.log(`[airdropCompressedNFTService] - Airdrop user's resolved wallet address: ${airdropuserresolvedWalletAddress}`);

    let resolvedWalletAddress: string;
    if (walletAddress === "default") {
        const walletDetails = await getWalletAddressesByUserId(userId);
        resolvedWalletAddress = walletDetails[0]?.publicKey;

        if (!resolvedWalletAddress) {
            console.warn('[airdropCompressedNFTService] - No default wallet found for the user.');
        }
    } else {
        resolvedWalletAddress = walletAddress;
    }

    const ownerPrivateKey = await getPrivateKeyFromSession(userId, resolvedWalletAddress, jwtToken);
    console.log('[airdropCompressedNFTService] - Retrieved owner private key from session');

    const ownerKeypair = Keypair.fromSecretKey(ownerPrivateKey);
    console.log(`[airdropCompressedNFTService] - OWNER PUBLIC KEY: ${ownerKeypair.publicKey.toString()}`);

    // Adding a 2-second delay before minting cNFT
    await new Promise(resolve => setTimeout(resolve, 2000));

    const response: any = await MintCNftShyft(serverKeyPair, ownerKeypair, metaData, merkleTree, airdropuserresolvedWalletAddress, network);
    console.log(`[airdropCompressedNFTService] - Response from MintCNftShyft: ${JSON.stringify(response)}`);

    const signedTx = await partialSignTransactionWithPrivateKeys(response.encoded_transaction, [uint8ArrayToBase58(serverKeyPair.secretKey), uint8ArrayToBase58(ownerKeypair.secretKey)]);
    console.log('[airdropCompressedNFTService] - Transaction partially signed');

    const confirmedTx = await connection.sendRawTransaction(signedTx.serialize());
    console.log(`[airdropCompressedNFTService] - Transaction confirmed: ${JSON.stringify(confirmedTx)}`);

    console.log('[airdropCompressedNFTService] - End');
    return {
        transaction: confirmedTx,
        mintAddress: response.mint
    }
}


// export const RevokerealinkairdropCompressedNFTService = async (body: any, jwtToken: string, userId: string) => {
//     console.log('[airdropCompressedNFTService] - Start');

//     const { walletAddress, metaData, merkleTree, username, network } = body;
//     console.log(`[airdropCompressedNFTService] - Received parameters: walletAddress=${walletAddress}, username=${username}, network=${network}, metaData=${metaData}, merkleTree=${merkleTree}`);

//     const airdropuser = await User.findOne({ username });
//     if (!airdropuser) {
//         console.error('[airdropCompressedNFTService] - User not found for username:', username);
//         throw new Error('User not found');
//     }
//     const airdropuserId = airdropuser._id.toString();
//     console.log(`[airdropCompressedNFTService] - Found user with ID: ${airdropuserId}`);

//     const connection = new Connection(setSolanaCluster(network));

//     if (!process.env.GAME_SERVER_PRIVATE_KEY) {
//         console.error('[airdropCompressedNFTService] - GAME_SERVER_PRIVATE_KEY not found in environment variables');
//         throw new Error('GAME_SERVER_PRIVATE_KEY not found in environment variables');
//     }

//     const serverKeyPair = Keypair.fromSecretKey(base58ToUint8Array(process.env.GAME_SERVER_PRIVATE_KEY));

//     let airdropuserresolvedWalletAddress: string;
//     if (walletAddress === "default") {
//         const walletDetails = await getWalletAddressesByUserId(airdropuserId);
//         airdropuserresolvedWalletAddress = walletDetails[0]?.publicKey;

//         if (!airdropuserresolvedWalletAddress) {
//             console.warn('[airdropCompressedNFTService] - No default wallet found for the airdrop user.');
//         }
//     } else {
//         airdropuserresolvedWalletAddress = walletAddress;
//     }
//     console.log(`[airdropCompressedNFTService] - Airdrop user's resolved wallet address: ${airdropuserresolvedWalletAddress}`);

//     const listOfcNFTs = await getAllcNFTsShyft(resolvedWalletAddress, network);
//     console.log("List of cNFTs:", listOfcNFTs);


//     asd


//     let resolvedWalletAddress: string;
//     if (walletAddress === "default") {
//         const walletDetails = await getWalletAddressesByUserId(userId);
//         resolvedWalletAddress = walletDetails[0]?.publicKey;

//         if (!resolvedWalletAddress) {
//             console.warn('[airdropCompressedNFTService] - No default wallet found for the user.');
//         }
//     } else {
//         resolvedWalletAddress = walletAddress;
//     }

//     const ownerPrivateKey = await getPrivateKeyFromSession(userId, resolvedWalletAddress, jwtToken);
//     console.log('[airdropCompressedNFTService] - Retrieved owner private key from session');

//     const ownerKeypair = Keypair.fromSecretKey(ownerPrivateKey);
//     console.log(`[airdropCompressedNFTService] - OWNER PUBLIC KEY: ${ownerKeypair.publicKey.toString()}`);

//     // Adding a 2-second delay before minting cNFT
//     await new Promise(resolve => setTimeout(resolve, 2000));

//     const response: any = await MintCNftShyft(serverKeyPair, ownerKeypair, metaData, merkleTree, airdropuserresolvedWalletAddress, network);
//     console.log(`[airdropCompressedNFTService] - Response from MintCNftShyft: ${JSON.stringify(response)}`);

//     const signedTx = await partialSignTransactionWithPrivateKeys(response.encoded_transaction, [uint8ArrayToBase58(serverKeyPair.secretKey), uint8ArrayToBase58(ownerKeypair.secretKey)]);
//     console.log('[airdropCompressedNFTService] - Transaction partially signed');

//     const confirmedTx = await connection.sendRawTransaction(signedTx.serialize());
//     console.log(`[airdropCompressedNFTService] - Transaction confirmed: ${JSON.stringify(confirmedTx)}`);

//     console.log('[airdropCompressedNFTService] - End');
//     return {
//         transaction: confirmedTx,
//         mintAddress: response.mint
//     }
// }

// interface MintCompressedNFTInput {
//     walletAddress: string;
//     metaData: string;
//     merkleTree: string;
//     username: string;
//     network: string;
//     jwtToken: string;
// }

// const getMerkleeTreeRelatedcNFTs(merkleTree: string, allcNfts: any) {

// }

// export const mintCompressedNFTInternal = async (input: MintCompressedNFTInput) => {
//     console.log('[mintCompressedNFT] - Start');

//     const { walletAddress, metaData, merkleTree, username, network, jwtToken } = input;
//     console.log(`[mintCompressedNFT] - Received parameters: walletAddress=${walletAddress}, username=${username}, network=${network}, metaData=${metaData}, merkleTree=${merkleTree}`);

//     const user = await User.findOne({ username });
//     const userId = user?._id.toString();
//     console.log(`[mintCompressedNFT] - Found user with ID: ${userId}`);

//     const connection = new Connection(setSolanaCluster(network));

//     if (!process.env.GAME_SERVER_PRIVATE_KEY) {
//         console.error('[mintCompressedNFT] - GAME_SERVER_PRIVATE_KEY not found in environment variables');
//         throw new Error('GAME_SERVER_PRIVATE_KEY not found in environment variables');
//     }

//     const serverKeyPair = Keypair.fromSecretKey(base58ToUint8Array(process.env.GAME_SERVER_PRIVATE_KEY));

//     let resolvedWalletAddress: string;
//     if (walletAddress === "default") {
//         const walletDetails = await getWalletAddressesByUserId(userId);
//         resolvedWalletAddress = walletDetails[0]?.publicKey;

//         if (!resolvedWalletAddress) {
//             console.warn('[mintCompressedNFT] - No default wallet found for the user.');
//             throw new Error('No default wallet found for the user.');
//         }
//     } else {
//         resolvedWalletAddress = walletAddress;
//     }
//     console.log(`[mintCompressedNFT] - Resolved wallet address: ${resolvedWalletAddress}`);

//     const ownerPrivateKey = await getPrivateKeyFromSession(userId, resolvedWalletAddress, jwtToken);
//     console.log('[mintCompressedNFT] - Retrieved owner private key from session');

//     const ownerKeypair = Keypair.fromSecretKey(ownerPrivateKey);
//     console.log(`[mintCompressedNFT] - OWNER PUBLIC KEY: ${ownerKeypair.publicKey.toString()}`);

//     // Adding a 2-second delay before minting cNFT
//     await new Promise(resolve => setTimeout(resolve, 10000));

//     const response: any = await MintCNftShyft(serverKeyPair, ownerKeypair, metaData, merkleTree, resolvedWalletAddress, network);
//     console.log(`[mintCompressedNFT] - Response from MintCNftShyft: ${JSON.stringify(response)}`);

//     const signedTx = await partialSignTransactionWithPrivateKeys(response.encoded_transaction, [uint8ArrayToBase58(serverKeyPair.secretKey), uint8ArrayToBase58(ownerKeypair.secretKey)]);
//     console.log('[mintCompressedNFT] - Transaction partially signed');

//     const confirmedTx = await connection.sendRawTransaction(signedTx.serialize());
//     console.log(`[mintCompressedNFT] - Transaction confirmed: ${JSON.stringify(confirmedTx)}`);

//     console.log('[mintCompressedNFT] - End');
//     return confirmedTx;
// }

