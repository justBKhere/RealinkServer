import { Request, Response } from 'express';
import { createMetadata } from '../DataController/dataController';
import { airdropCompressedNFTService, createMerkleeTreeService, mintCompressedNFTService, /*RevokerealinkairdropCompressedNFTService*/ } from '../../services/SolanaServices/solanaTokenService';
import { body } from 'express-validator';
import { DuplicateJsonToCustomUser } from '../DataController/s3Controller';
export const CreateProject = async (req: Request, res: Response) => {
    console.log("CreateProject - Start");  // Log when the function starts

    try {

        // Extract relevant data from the request
        const { network, walletAddress, username, name, description, symbol, attributes, royalty, creator, share, external_url, properties, seller_fee_basis_points } = req.body;
        console.log("Extracted data from request:", req.body);  // Log the extracted data

        if (!req.file) {
            console.warn("No file found in the request.");
            return res.status(400).send('No file uploaded.');
        }

        // Call the createMetadata internal function
        const metadataresult = await createMetadata(
            req.file, name, description, symbol, attributes, royalty, creator, share, external_url, properties, seller_fee_basis_points
        );
        console.log("Metadata result:", metadataresult);  // Log the metadata result



        req.body.metaData = metadataresult.link;
        console.log("Updated req.body with metadata:", req.body);  // Log the updated request body

        const requestParam: any = req;
        const userId = requestParam.user.id;
        console.log("User ID:", userId);  // Log the user ID

        const merkleeTreeResult = await createMerkleeTreeService(req.body, req.headers.authorization!, userId);
        console.log("MerkleeTreeResult:", merkleeTreeResult);  // Log the Merklee tree result



        const merkleeTreeAddress = merkleeTreeResult?.merkleeTree;
        req.body.merkleTree = merkleeTreeAddress;
        console.log("Updated req.body with merkleeTreeAddress:", req.body);  // Log the updated request body

        const mintMasterNftResponse = await mintCompressedNFTService(req.body, req.headers.authorization!);
        console.log("MintMasterNftResponse:", mintMasterNftResponse);  // Log the mint master NFT response

        res.status(200).json({ message: "Merklee tree successfully created and master compressed NFT minted", mintMasterNftResponse, "merkleeTreeAddress": merkleeTreeAddress, "metadataLink": metadataresult.link });

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Error in CreateProject:", errorMessage);  // Log the error message
        res.status(500).send(`Failed to create project: ${errorMessage}`);
    }

    console.log("CreateProject - End");  // Log when the function ends
};

export const CreateRealinkAccessKey = async (req: Request, res: Response) => {
    const { network, metaData, merkleTree, name, mintAddress, username, walletAddress } = req.body;
    const userMetaDataLink = await DuplicateJsonToCustomUser(name, username + merkleTree);
    console.log("userMetaDataLink", userMetaDataLink);
    req.body.metaData = userMetaDataLink;
    const mintMasterNftResponse = await mintCompressedNFTService(req.body, req.headers.authorization!);
}

export const CreateRealinkAccessKeyRemote = async (req: Request, res: Response) => {
    try {
        const { network, metaData, merkleTree, name, mintAddress, username, walletAddress } = req.body;
        const userMetaDataLink = await DuplicateJsonToCustomUser(name, username + merkleTree);
        console.log("userMetaDataLink", userMetaDataLink);
        req.body.metaData = userMetaDataLink;
        const requestParam: any = req;
        const userId = requestParam.user.id;
        console.log("User ID:", userId);  // Log the user ID

        const airdropcNFTResponse = await airdropCompressedNFTService(req.body, req.headers.authorization!, userId);
        res.status(200).json({ message: "Merklee tree successfully created and master compressed NFT minted", airdropcNFTResponse });

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Error in CreateProject:", errorMessage);  // Log the error message
        res.status(500).send(`Failed to create project: ${errorMessage}`);
    }
}

export const RevokeRealinkAccessKey = async (req: Request, res: Response) => {
    try {
        const { merkleeTree, username } = req.body;
        const requestParam: any = req;
        const userId = requestParam.user.id;
        console.log("User ID:", userId);

        //const revokecNFTAccessResponse = await RevokerealinkairdropCompressedNFTService(req.body, req.headers.authorization!, userId);
    }
    catch (error: any) {
        const errorMessage = (error as Error).message;
        console.error("Error in CreateProject:", errorMessage);  // Log the error message
        res.status(500).send(`Failed block access: ${errorMessage}`);
    }
}