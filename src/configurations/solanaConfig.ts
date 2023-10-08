const dotenv = require('dotenv');
dotenv.config();

export const config = {
    devnetEndpoint: process.env.DEVNET_ENDPOINT || 'https://api.devnet.solana.com',
    testnetEndpoint: process.env.TESTNET_ENDPOINT || 'https://api.testnet.solana.com',
    mainnetEndpoint: process.env.MAINNET_ENDPOINT || 'https://api.mainnet-beta.solana.com',
    solanaExplorer: process.env.SOLANA_EXPLORER || 'https://explorer.solana.com',
};


