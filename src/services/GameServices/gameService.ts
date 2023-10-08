

import { UserService } from "../userService";
import dotenv from 'dotenv'
import { SendAssetIx, SendAssetToPlayer, SendandSignTransaction } from './solanaGameService';
import { resources } from '../../configurations/resourceConfig';
import { getPrivateKeyFromSession } from "../SolanaServices/solanaTransactionService";
import { Keypair, Transaction } from "@solana/web3.js";
dotenv.config();


const userService = new UserService();
const METAL_TOKEN_ADDRESS = process.env.METAL_TOKEN_ADDRESS || resources.METAL_TOKEN_ADDRESS;
const WATER_TOKEN_ADDRESS = process.env.WATER_TOKEN_ADDRESS || resources.WATER_TOKEN_ADDRESS;
const STONE_TOKEN_ADDRESS = process.env.STONE_TOKEN_ADDRESS || resources.STONE_TOKEN_ADDRESS;
const CRYSTAL_TOKEN_ADDRESS = process.env.CRYSTAL_TOKEN_ADDRESS || resources.CRYSTAL_TOKEN_ADDRESS;
const ENERGY_FRAGMENT_TOKEN_ADDRESS = process.env.ENERGY_FRAGMENT_TOKEN_ADDRESS || resources.ENERGY_FRAGMENT_TOKEN_ADDRESS;
const NANO_MATERIALS_TOKEN_ADDRESS = process.env.NANO_MATERIALS_TOKEN_ADDRESS || resources.NANO_MATERIALS_TOKEN_ADDRESS;
const HYDROGEN_TOKEN_ADDRESS = process.env.HYDROGEN_TOKEN_ADDRESS || resources.HYDROGEN_TOKEN_ADDRESS;
const OXYGEN_TOKEN_ADDRESS = process.env.OXYGEN_TOKEN_ADDRESS || resources.OXYGEN_TOKEN_ADDRESS;
const RADIOACTIVE_TOKEN_ADDRESS = process.env.RADIOACTIVE_TOKEN_ADDRESS || resources.RADIOACTIVE_TOKEN_ADDRESS;
const ORGANIC_MATERIAL_TOKEN_ADDRESS = process.env.ORGANIC_MATERIAL_TOKEN_ADDRESS || resources.ORGANIC_MATERIAL_TOKEN_ADDRESS;

const METAL_QUANTITY = parseInt(process.env.METAL_QUANTITY!) || resources.METAL_QUANTITY;
const WATER_QUANTITY = parseInt(process.env.WATER_QUANTITY!) || resources.WATER_QUANTITY;
const STONE_QUANTITY = parseInt(process.env.STONE_QUANTITY!) || resources.STONE_QUANTITY;
const CRYSTAL_QUANTITY = parseInt(process.env.CRYSTAL_QUANTITY!) || resources.CRYSTAL_QUANTITY;
const ENERGY_FRAGMENT_QUANTITY = parseInt(process.env.ENERGY_FRAGMENT_QUANTITY!) || resources.ENERGY_FRAGMENT_QUANTITY;
const NANO_MATERIALS_QUANTITY = parseInt(process.env.NANO_MATERIALS_QUANTITY!) || resources.NANO_MATERIALS_QUANTITY;
const HYDROGEN_QUANTITY = parseInt(process.env.HYDROGEN_QUANTITY!) || resources.HYDROGEN_QUANTITY;
const OXYGEN_QUANTITY = parseInt(process.env.OXYGEN_QUANTITY!) || resources.OXYGEN_QUANTITY;
const RADIOACTIVE_MATERIALS_QUANTITY = parseInt(process.env.RADIOACTIVE_MATERIALS_QUANTITY!) || resources.RADIOACTIVE_MATERIALS_QUANTITY;
const ORGANIC_MATERIAL_QUANTITY = parseInt(process.env.ORGANIC_MATERIAL_QUANTITY!) || resources.ORGANIC_MATERIAL_QUANTITY;


export async function handleItemPickup(req: any) {
    const { network, tokenAddress, walletAddress, level } = req.body;
    const decodedToken: any = req;
    const userId = decodedToken.user.id;
    const user = await userService.findUserbyID(userId);

    if (!user) {
        console.log("User not found");
        return false;
    }
    else {

    }

    console.log("User:", user);
    console.log("Token Address:", tokenAddress);
    console.log("Level:", level);
    console.log("Network:", network);

    const parsedLevel = parseInt(level);

    try {
        let updatedTokenBalance: any;

        switch (tokenAddress) {
            case METAL_TOKEN_ADDRESS:
                updatedTokenBalance = await SendAssetToPlayer(tokenAddress, walletAddress, METAL_QUANTITY, network);
                break;
            case WATER_TOKEN_ADDRESS:
                updatedTokenBalance = await SendAssetToPlayer(tokenAddress, walletAddress, WATER_QUANTITY, network);
                break;
            case STONE_TOKEN_ADDRESS:
                updatedTokenBalance = await SendAssetToPlayer(tokenAddress, walletAddress, STONE_QUANTITY, network);
                break;
            case CRYSTAL_TOKEN_ADDRESS:
                updatedTokenBalance = await SendAssetToPlayer(tokenAddress, walletAddress, CRYSTAL_QUANTITY, network);
                break;
            case ENERGY_FRAGMENT_TOKEN_ADDRESS:
                updatedTokenBalance = await SendAssetToPlayer(tokenAddress, walletAddress, ENERGY_FRAGMENT_QUANTITY, network);
                break;
            case NANO_MATERIALS_TOKEN_ADDRESS:
                updatedTokenBalance = await SendAssetToPlayer(tokenAddress, walletAddress, NANO_MATERIALS_QUANTITY, network);
                break;
            case HYDROGEN_TOKEN_ADDRESS:
                updatedTokenBalance = await SendAssetToPlayer(tokenAddress, walletAddress, HYDROGEN_QUANTITY, network);
                break;
            case OXYGEN_TOKEN_ADDRESS:
                updatedTokenBalance = await SendAssetToPlayer(tokenAddress, walletAddress, OXYGEN_QUANTITY, network);
                break;
            case RADIOACTIVE_TOKEN_ADDRESS:
                updatedTokenBalance = await SendAssetToPlayer(tokenAddress, walletAddress, RADIOACTIVE_MATERIALS_QUANTITY, network);
                break;
            case ORGANIC_MATERIAL_TOKEN_ADDRESS:
                updatedTokenBalance = await SendAssetToPlayer(tokenAddress, walletAddress, ORGANIC_MATERIAL_QUANTITY, network);
                break;
            default:
                console.log("Invalid token address:", tokenAddress);
                return null;
        }

        return updatedTokenBalance;
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

export async function buildUsingTokens(req: any) {
    const { network, walletAddress, tokenData } = req.body;
    console.log("tokenData", tokenData.toString());

    const jwtToken = req.headers.authorization;
    const decodedToken: any = req;
    const userId = decodedToken.user.id;
    const transaction = new Transaction();
    const resourceRequirements = tokenData;
    try {
        const user = await userService.findUserbyID(userId);

        const senderKeypair = Keypair.fromSecretKey(await getPrivateKeyFromSession(userId, walletAddress, jwtToken));

        for (const requirement of resourceRequirements) {
            console.log("Requirement:", requirement);
            const { resourceName, requiredAmount } = requirement;
            console.log("Resource Address: ", resourceName);
            const txIx = await SendAssetIx(resourceName, walletAddress, requiredAmount, network);
            if (txIx) {
                transaction.add(txIx);
            }
            else {
                console.log("Invalid tx");
                return null;
            }
        }
        const updatedTokenBalance = await SendandSignTransaction(transaction, senderKeypair, network);
        return updatedTokenBalance;
    }
    catch (error) {
        console.error("Error:", error);
        return null;
    }

}