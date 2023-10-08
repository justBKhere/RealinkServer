import mongoose, { Document, Schema } from 'mongoose';
import { On3SolWalletDB } from '../services/dbmsHandler';

interface WalletBlock {
    publicKey: string;
    encryptedPrivateKey: string; // Encrypted private key
    encryptedMnemonic: string;   // Encrypted mnemonic
    name: string;
}

interface ReadonlyWallet {
    publicKey: string;
    name: string;
}

export interface ISolanaWallet extends Document {
    userId: mongoose.Types.ObjectId;
    createdWallets: WalletBlock[];
    importedWallets: WalletBlock[];
    readonlyWallets: ReadonlyWallet[];
}

const SolanaWalletSchema: Schema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    createdWallets: [{
        publicKey: {
            type: String,
            required: true
        },
        encryptedPrivateKey: {
            type: String,
            required: true
        },
        encryptedMnemonic: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        }
    }],
    importedWallets: [{
        publicKey: {
            type: String,
            required: true
        },
        encryptedPrivateKey: {
            type: String,
            required: true
        },
        encryptedMnemonic: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        }
    }],
    readonlyWallets: [{
        publicKey: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        }
    }]
});

export const SolanaWallet = On3SolWalletDB.model<ISolanaWallet>('SolanaWallet', SolanaWalletSchema);
