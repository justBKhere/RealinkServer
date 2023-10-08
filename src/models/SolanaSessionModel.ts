import mongoose, { Document, Schema } from 'mongoose';
import { On3SolWalletSessionDB } from '../services/dbmsHandler';
import { ISolanaWallet } from './SolanaWallets';

export interface WalletBlock {
    publicKey: string;
    encryptedPrivateKey: string; // Encrypted private key
    encryptedMnemonic: string;   // Encrypted mnemonic
    name: string;
}

interface ReadonlyWallet {
    publicKey: string;
    name: string;
}



const SessionSchema: Schema = new Schema({
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

export const Session = On3SolWalletSessionDB.model<ISolanaWallet>('Session', SessionSchema);
