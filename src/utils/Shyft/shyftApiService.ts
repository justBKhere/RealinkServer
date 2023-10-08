import { ShyftSdk, Network } from '@shyft-to/js';
import { Keypair } from '@solana/web3.js';
import dotenv from 'dotenv';
import { response } from 'express';
import { blob } from 'stream/consumers';
dotenv.config();

const shyft = SetShyftSDK(Network.Devnet);

export function SetShyftSDK(network: string) {

    if (network == "devnet") {
        return new ShyftSdk({ apiKey: process.env.SHYFT_API_KEY!, network: Network.Devnet });
    }
    else if (network == "testnet") {
        return new ShyftSdk({ apiKey: process.env.SHYFT_API_KEY!, network: Network.Testnet });
    }
    else if (network == "mainnet-beta") {
        return new ShyftSdk({ apiKey: process.env.SHYFT_API_KEY!, network: Network.Mainnet });
    }
    return new ShyftSdk({ apiKey: process.env.SHYFT_API_KEY!, network: Network.Devnet });
}


export async function GetPortfolio(walletAddress: string, network: string) {
    const response = await SetShyftSDK(network).wallet.getPortfolio({ wallet: walletAddress });
    console.log(response);
    return response;
}

export async function GetAllTokenBalances(walletAddress: string, network: string) {
    console.log("network", network);
    console.log("walletAddress", walletAddress);
    const response = await SetShyftSDK(network).wallet.getAllTokenBalance({ wallet: walletAddress });
    console.log(response);
    return response;
}

export async function GetAllNFTsShyft(walletAddress: string, network: string) {
    const response = await SetShyftSDK(network).wallet.collections({ wallet: walletAddress });
    console.log(response);
    return response;
}

export async function GetAllDomainsShyft(walletAddress: string, network: string) {
    const response = await SetShyftSDK(network).wallet.getDomains({ wallet: walletAddress });
    return response;
}

export async function GetAllTransactionsShyft(walletAddress: string, network: string) {
    const response = await SetShyftSDK(network).wallet.transactionHistory({ wallet: walletAddress });
    return response;
}


export async function CreateFungibleTokenShyft(authorityAddress: string, Name: string, Symbol: string, Description: string, Decimals: number, File: File, Network: string) {
    try {
        console.log("authorityAddress", authorityAddress);
        console.log("name", Name);
        console.log("symbol", Symbol);
        console.log("description", Description);
        console.log("file", File);


        const blob = new Blob([File], {});
        //const response = await SetShyftSDK(Network).token.create({ creatorWallet: authorityAddress, name: Name, symbol: Symbol, description: Description, decimals: Decimals, image: blob });
        var myHeaders = new Headers();
        myHeaders.append("x-api-key", process.env.SHYFT_API_KEY!);

        var formdata = new FormData();
        formdata.append("network", "devnet");
        formdata.append("wallet", authorityAddress);
        formdata.append("name", Name);
        formdata.append("symbol", Symbol);
        formdata.append("description", Description);
        formdata.append("decimals", Decimals.toString());
        formdata.append("file", blob, File.name);
        //formdata.append("fee_payer", "AaYFExyZuMHbJHzjimKyQBAH1yfA9sKTxSzBc6Nr5X4s");

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: formdata
        };

        const response = await fetch("https://api.shyft.to/sol/v1/token/create_detach", requestOptions)

        return await response.json();
    }
    catch (error) {
        console.log("ShyftError:", error);
    }
    //return response;

}

export async function MintFungibleTokenShyft(authorityAddress: string, ReceiverAddress: string, TokenAddress: string, Amount: number, Message: string, Network: string) {

    console.log("authorityAddress", authorityAddress);
    console.log("TokenAddress", TokenAddress);
    console.log("ReceiverAddress", ReceiverAddress);
    console.log("Amount", Amount);
    console.log("Message", Message);

    const response = await SetShyftSDK(Network).token.mint({ mintAuthority: authorityAddress, receiver: ReceiverAddress, tokenAddress: TokenAddress, amount: Amount, message: Message });
    return response;

}

export async function BurnTokenShyft(walletAddress: string, tokenAddress: string, amount: number, Network: string) {
    console.log("walletAddress", walletAddress);
    console.log("tokenAddress", tokenAddress);
    console.log("amount", amount);
    try {
        const response = await SetShyftSDK(Network).token.burn({ wallet: walletAddress, tokenAddress: tokenAddress, amount: amount });
        return response;
    }
    catch (error) {
        console.log("ShyftError:", error);
    }

}

export async function AirdropTokenShyft(walletAddress: string, tokenAddress: string, transferInfo: any, Network: string) {
    console.log("walletAddress", walletAddress);
    console.log("tokenAddress", tokenAddress);
    console.log("transferInfo", transferInfo);
    try {
        const response = await SetShyftSDK(Network).token.airdrop({ fromAddress: walletAddress, tokenAddress: tokenAddress, transferTo: transferInfo });
        console.log("response", response);
        return response;
    }
    catch (error) {
        console.log("ShyftError:", error);
    }
}

export async function MintCNftShyft(serverKeyPair: Keypair, metaData: string, merkleTree: string, walletAddress: string, Network: string) {
    console.log("metaData", metaData);
    console.log("merkleTree", merkleTree);
    console.log("walletAddress", walletAddress);
    try {
        const response = await SetShyftSDK(Network).nft.compressed.mint({ creatorWallet: serverKeyPair.publicKey.toString(), merkleTree: merkleTree, metadataUri: metaData, receiver: walletAddress, feePayer: serverKeyPair.publicKey.toString() });
        return response;
    }
    catch (error) {
        console.log("ShyftError:", error);
    }
}