import { Cluster, Keypair, PublicKey } from '@solana/web3.js';
import * as bip39 from 'bip39';
import * as ed25519_hd_key from 'ed25519-hd-key';
import { config } from '../../configurations/solanaConfig';

import { CryptoUtils } from '../../utils/cryptoUtils';
import { ISolanaWallet, SolanaWallet } from '../../models/SolanaWallets';
import { CustomError } from '../../utils/customError';


import { Connection, clusterApiUrl } from '@solana/web3.js';
import { GetAllTokenBalances, GetPortfolio, SetShyftSDK } from '../../utils/Shyft/shyftApiService';
import { Session } from '../../models/SolanaSessionModel';


interface SolWallet {
    keypair: Keypair;
    mnemonic: string;
    publicAddress: string;
}

const password = "user_password_here"; // This should come from user input
const salt = "user_email_or_username"; // This should be unique per user, but consistent


let solanaEndpoint = clusterApiUrl('mainnet-beta');

export function setSolanaCluster(cluster: string) {
    if (isCluster(cluster)) {
        solanaEndpoint = clusterApiUrl(cluster);
        SetShyftSDK(cluster);
        return solanaEndpoint;
    } else {
        throw new CustomError("Invalid cluster specified", 400);
    }
}

function isCluster(cluster: string): cluster is Cluster {
    return ['mainnet-beta', 'testnet', 'devnet'].includes(cluster);
}


function generate_Sol_Wallet(): SolWallet {
    const wallet: SolWallet = {} as SolWallet;
    const mnemonic = bip39.generateMnemonic(256);
    const master_seed = bip39.mnemonicToSeedSync(mnemonic);
    const index = 0;
    const derived_path = `m/44'/501'/${index}'/0'`;
    const derived_seed = ed25519_hd_key.derivePath(derived_path, master_seed.toString('hex')).key;
    wallet.keypair = Keypair.fromSeed(derived_seed);
    wallet.mnemonic = mnemonic;
    wallet.publicAddress = wallet.keypair.publicKey.toBase58();
    console.log("wallet mnemonic: " + wallet.mnemonic);
    console.log(wallet.keypair.publicKey.toBase58());
    return wallet;
}

function loadWalletFromMnemonic(mnemonic: string): SolWallet {
    const wallet: SolWallet = {} as SolWallet;
    const master_seed = bip39.mnemonicToSeedSync(mnemonic);
    const index = 0;
    const derived_path = `m/44'/501'/${index}'/0'`;
    const derived_seed = ed25519_hd_key.derivePath(derived_path, master_seed.toString('hex')).key;
    wallet.keypair = Keypair.fromSeed(derived_seed);
    wallet.mnemonic = mnemonic;
    wallet.publicAddress = wallet.keypair.publicKey.toBase58();
    console.log("Loaded wallet: " + wallet.mnemonic);
    console.log(wallet.keypair.publicKey.toBase58());
    return wallet;
}


async function AddNewWalletFromMnemonic(userId: string, password: string, mnemonic: string, name: string = "Imported Wallet"): Promise<any> {
    try {
        // Find the Solana wallet for the user
        const wallet = await SolanaWallet.findOne({ userId: userId });

        if (!wallet) {
            throw new CustomError("Wallet not found for the specified user", 404);
        }

        // Load the wallet from mnemonic
        const loadedWallet = loadWalletFromMnemonic(mnemonic);

        // Check if the wallet with this public key already exists among imported wallets
        const existingWallet = wallet.importedWallets.find(w => w.publicKey === loadedWallet.publicAddress);
        if (existingWallet) {
            throw new CustomError("Wallet with this mnemonic already imported", 409);
        }

        // Encrypt the mnemonic and private key using the user's password for storage
        const encryptedMnemonic = CryptoUtils.encrypt(mnemonic, password);
        const encryptedPrivateKey = CryptoUtils.encrypt(loadedWallet.keypair.secretKey.toString(), password); // Convert Uint8Array to string before encrypting

        // Add the new wallet to the imported wallets array
        wallet.importedWallets.push({
            publicKey: loadedWallet.publicAddress,
            encryptedMnemonic: encryptedMnemonic,
            encryptedPrivateKey: encryptedPrivateKey,
            name: name
        });

        // Save the updated wallet in the database
        await wallet.save();

        return {
            message: "Wallet imported successfully",
            publicAddress: loadedWallet.publicAddress
        };
    } catch (error: any) {
        // Handle the error appropriately
        throw new CustomError(error.message || "An error occurred while importing the wallet", 500);
    }
}
export async function reEncryptWalletData(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    console.log(`Starting re-encryption for user with ID: ${userId}`);

    const wallet = await SolanaWallet.findOne({ userId: userId });

    if (!wallet) {
        console.error(`Error: Wallet not found for the user with ID: ${userId}`);
        throw new CustomError("Wallet not found for the specified user", 404);
    }
    console.log(`Wallet data retrieved for user with ID: ${userId}`);

    // Re-encrypt sensitive data in the wallet for created wallets
    wallet.createdWallets = wallet.createdWallets.map(w => {
        const decryptedPrivateKey = CryptoUtils.decrypt(w.encryptedPrivateKey, oldPassword);
        const decryptedMnemonic = CryptoUtils.decrypt(w.encryptedMnemonic, oldPassword);
        return {
            ...w,
            encryptedPrivateKey: CryptoUtils.encrypt(decryptedPrivateKey, newPassword),
            encryptedMnemonic: CryptoUtils.encrypt(decryptedMnemonic, newPassword)
        };
    });
    console.log(`Re-encrypted created wallets for user with ID: ${userId}`);

    // Re-encrypt sensitive data in the wallet for imported wallets
    wallet.importedWallets = wallet.importedWallets.map(w => {
        const decryptedPrivateKey = CryptoUtils.decrypt(w.encryptedPrivateKey, oldPassword);
        const decryptedMnemonic = CryptoUtils.decrypt(w.encryptedMnemonic, oldPassword);
        return {
            ...w,
            encryptedPrivateKey: CryptoUtils.encrypt(decryptedPrivateKey, newPassword),
            encryptedMnemonic: CryptoUtils.encrypt(decryptedMnemonic, newPassword)
        };
    });
    console.log(`Re-encrypted imported wallets for user with ID: ${userId}`);

    await wallet.save();
    console.log(`Saved updated wallet data for user with ID: ${userId}`);
}


export async function createSessionWalletData(userId: string, oldPassword: string, newPassword: string): Promise<void> {

}

export const getWalletsByUserId = async (userId: string): Promise<ISolanaWallet | null> => {
    return await SolanaWallet.findOne({ userId });
};

export const getWalletAddressesByUserId = async (userId: string): Promise<{ name: string, publicKey: string }[]> => {
    const solanaWallet = await getWalletsByUserId(userId);
    if (!solanaWallet) {
        throw new CustomError('No Solana wallets found for the user', 404);
    }
    return [
        ...solanaWallet.createdWallets.map(wallet => ({ name: wallet.name, publicKey: wallet.publicKey })),
        ...solanaWallet.importedWallets.map(wallet => ({ name: wallet.name, publicKey: wallet.publicKey })),
        ...solanaWallet.readonlyWallets.map(wallet => ({ name: wallet.name, publicKey: wallet.publicKey }))
    ];
};

export const getDefaultWalletPortfolio = async (userId: string, network: string): Promise<any> => {
    try {
        const walletDetails = await getWalletAddressesByUserId(userId);
        const portfolio = GetPortfolio(network, walletDetails[0].publicKey);
        return portfolio;
    } catch (error) {
        throw new CustomError("Error getting wallet details", 500);
    }
}


export const getWalletPortfolioByAddress = async (walletAddress: string, network: string): Promise<any> => {
    try {
        const portfolio = GetPortfolio(walletAddress, network);
        return portfolio;
    } catch (error) {
        throw new CustomError("Error getting wallet details", 500);
    }
}

export const getWalletBalance = async (publicKey: string, network?: string): Promise<number | null> => {
    if (network) {
        setSolanaCluster(network);

    }
    const connection = new Connection(solanaEndpoint);
    const balance = await connection.getBalance(new PublicKey(publicKey));
    return balance;

}

export const getAllTokenBalances = async (publicKey: string, network?: string): Promise<any[]> => {

    const tokenBalances = GetAllTokenBalances(network!, publicKey);
    return tokenBalances;
}

export {
    generate_Sol_Wallet,
    loadWalletFromMnemonic,
    AddNewWalletFromMnemonic
};
