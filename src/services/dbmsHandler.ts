import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const options:ConnectOptions = {
  // ... any other options you'd like
};

export const On3AccountDB = mongoose.createConnection(process.env.DB_URI_ACCOUNT_DB!, options);

On3AccountDB.on('error', err => {
  console.error(`Failed to connect to DB_URI_ACCOUNT_DB with error: ${err}`);
});

export const On3SolWalletDB = mongoose.createConnection(process.env.DB_URI_SOLWALLET_DB!, options);

On3SolWalletDB.on('error', err => {
  console.error(`Failed to connect to DB_URI_WALLET_DB with error: ${err}`);
});

export const On3SolWalletSessionDB = mongoose.createConnection(process.env.DB_URI_SOLWALLET_SESSION_DB!, options);

On3SolWalletSessionDB.on('error', err => {
  console.error(`Failed to connect to DB_URI_WALLET_SESSION_DB with error: ${err}`);
})

On3AccountDB.on('disconnected', () => {
    console.warn('Lost connection to DB_URI_ACCOUNT_DB');
  });
  
  On3AccountDB.on('reconnected', () => {
    console.info('Reconnected to DB_URI_ACCOUNT_DB');
  });
  
  On3SolWalletDB.on('disconnected', () => {
    console.warn('Lost connection to DB_URI_WALLET_DB');
  });
  
  On3SolWalletDB.on('reconnected', () => {
    console.info('Reconnected to DB_URI_WALLET_DB');
  });
  
  On3SolWalletSessionDB.on('disconnected', () => {
    console.warn('Lost connection to DB_URI_WALLET_SESSION_DB');
  })

  On3SolWalletSessionDB.on('reconnected', () => {
    console.info('Reconnected to DB_URI_WALLET_SESSION_DB');
  })