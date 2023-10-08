// services/solanaService.ts

import {
  Connection,
  Transaction,
  PublicKey,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { Session } from '../../models/SolanaSessionModel';
import { CryptoUtils } from '../../utils/cryptoUtils';
import { CustomError } from '../../utils/customError';
import { setSolanaCluster } from './solanaWalletService';
import { TOKEN_PROGRAM_ID, createTransferInstruction, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { base58ToUint8Array } from '../../utils/base58Utils';

export const sendSolService = async (body: any, jwtToken: string, userId: string) => {
  const { walletAddress, destinationAddress, amount, network } = body;
  const connection = new Connection(setSolanaCluster(network));

  try {
    const senderKeypair = Keypair.fromSecretKey(await getPrivateKeyFromSession(userId, walletAddress, jwtToken));

    const senderPublicKey = new PublicKey(walletAddress);
    const receiverPublicKey = new PublicKey(destinationAddress);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderPublicKey,
        toPubkey: receiverPublicKey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    const recentBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = recentBlockhash.blockhash;
    transaction.feePayer = senderPublicKey;

    const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);
    const solanaExplorerUrl = `https://explorer.solana.com/tx/${signature}`;

    return solanaExplorerUrl;

  } catch (error: any) {
    console.error('Error:', error);
    throw error;
  }
};


export const sendTokenService = async (body: any, jwtToken: string, userId: string) => {
  const { walletAddress, destinationAddress, amount, tokenMintAddress, network } = body;
  const connection = new Connection(setSolanaCluster(network));

  try {
    const senderPrivateKey = await getPrivateKeyFromSession(userId, walletAddress, jwtToken);
    const senderKeypair = Keypair.fromSecretKey(senderPrivateKey);

    const senderPublicKey = new PublicKey(walletAddress);
    const receiverPublicKey = new PublicKey(destinationAddress);
    const tokenMint = new PublicKey(tokenMintAddress);

    let sourceAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      senderKeypair,
      tokenMint,
      senderPublicKey
    )

    let destinationAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      senderKeypair,
      tokenMint,
      receiverPublicKey
    )

    const transferInstruction = createTransferInstruction(
      sourceAccount.address,
      destinationAccount.address,
      senderPublicKey,
      BigInt(amount),

    )

    const transaction = new Transaction().add(transferInstruction);
    const recentBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = recentBlockhash.blockhash;
    transaction.feePayer = senderPublicKey;

    const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);
    const solanaExplorerUrl = `https://explorer.solana.com/tx/${signature}`;
    console.log('%cClick here to view the transaction', 'color: blue; text-decoration: underline; cursor: pointer', solanaExplorerUrl);
    return solanaExplorerUrl;

  } catch (error: any) {
    console.error('Error:', error);
    throw error;
  }
};
export async function getPrivateKeyFromSession(userId: string, walletAddress: string, jwtToken: string): Promise<Uint8Array> {
  const tokenWithoutBearer = jwtToken.split(' ')[1];
  const session = await Session.findOne({ userId });
  console.log("walletAddress", walletAddress);
  if (!session) {
    throw new CustomError("Session not found", 404);
  }

  const wallet = session.createdWallets.find(w => w.publicKey === walletAddress) ||
    session.importedWallets.find(w => w.publicKey === walletAddress);

  if (!wallet) {
    throw new CustomError("Wallet not found in session", 404);
  }

  const decryptedPrivateKey = CryptoUtils.decrypt(wallet.encryptedPrivateKey, tokenWithoutBearer);

  return base58ToUint8Array(decryptedPrivateKey);
}
