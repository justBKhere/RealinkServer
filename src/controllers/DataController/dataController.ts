// controllers/dataController.ts

import { Request, Response } from 'express';
import { NFTStorage, File } from 'nft.storage';
import { uploadJSONToS3Internal, fetchJSONFromS3Internal, DuplicateJsonToCustomUser } from './s3Controller';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

import dotenv from 'dotenv';
dotenv.config();
const NFTStorageApiKey: string = process.env.NFT_STORAGE_API_KEY || "";
const nftStorageClient = new NFTStorage({ token: NFTStorageApiKey });

export const uploadDataToIPFS = async (req: Request, res: Response) => {
    console.log("Received data upload request for IPFS...");

    if (!req.file) {
        console.warn("No file found in the request.");
        return res.status(400).send('No file uploaded.');
    }

    console.log(`Preparing to upload file: ${req.file.originalname} to IPFS using NFT.Storage...`);

    try {
        const metadata = await nftStorageClient.store({
            name: req.file.originalname,
            description: 'Realink asset',
            image: new File([req.file.buffer], req.file.originalname, { type: req.file.mimetype })
        });

        console.log("Upload successful. Received metadata from NFT.Storage:", JSON.stringify(metadata, null, 2));

        // Use the URL object to parse the string and extract the CID
        const parsedURL = metadata.data.image;
        const ipfsCID = parsedURL.toString().split('://')[1];
        // Construct the cleaned-up URL
        const imageURL = `https://nftstorage.link/ipfs/${ipfsCID}`;

        console.log("Cleaned ImageURL:", imageURL);

        return res.status(200).json({ cid: metadata.ipnft, url: imageURL });

    } catch (error) {
        console.error("Error occurred during upload to IPFS:", error);
        return res.status(500).send('Error uploading to IPFS.');
    }
};

const uploadToIPFSInternal = async (file: Express.Multer.File) => {
    console.log(`Preparing to upload file: ${file.originalname} to IPFS using NFT.Storage...`);

    const metadata = await nftStorageClient.store({
        name: file.originalname,
        description: 'Realink asset',
        image: new File([file.buffer], file.originalname, { type: file.mimetype })
    });

    console.log("Upload successful. Received metadata from NFT.Storage:", JSON.stringify(metadata, null, 2));

    // Use the URL object to parse the string and extract the CID
    const parsedURL = metadata.data.image;
    const ipfsCID = parsedURL.toString().split('://')[1];
    // Construct the cleaned-up URL
    const imageURL = `https://nftstorage.link/ipfs/${ipfsCID}`;

    console.log("Cleaned ImageURL:", imageURL);

    return { cid: metadata.ipnft, url: imageURL };
};



export const CreateUserMetadata = async (req: Request, res: Response) => {
    try {
        const { username, masterMetadataLink } = req.body;

        // Fetch the content of the JSON file from the provided link
        const response = await axios.get(masterMetadataLink);
        const jsonData = response.data;

        // Extract the name from the JSON content
        const nameFromJson = jsonData.name; // Assuming the name is a direct property of the JSON

        // Add the username to the extracted name
        const newName = `${nameFromJson}_${username}`;

        // Create a copy of the metadata with the new name
        // Assuming DuplicateJsonToCustomUser takes the old name and new name as arguments
        const duplicateResponse = await DuplicateJsonToCustomUser(nameFromJson, newName);
        if (!duplicateResponse) {
            return res.status(500).send("Duplication failed");
        }

        // Return the link to the metadata stored in S3
        res.send({ link: duplicateResponse });
    } catch (error) {
        const errorMessage = (error as Error).message;
        res.status(500).send(`Failed to create metadata: ${errorMessage}`);
    }
}


export const uploadJSONToIPFS = async (req: Request, res: Response) => {
    console.log("Received JSON upload request for IPFS...");

    const jsonData = req.body;

    if (!jsonData) {
        console.warn("No JSON data found in the request.");
        return res.status(400).send('No JSON data provided.');
    }

    console.log(`Preparing to upload JSON data to IPFS using NFT.Storage...`);

    try {
        const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });
        const metadata = await nftStorageClient.store({
            name: "json-data",
            description: 'Realink JSON data',
            image: blob
        });

        console.log("Upload successful. Received metadata from NFT.Storage:", JSON.stringify(metadata, null, 2));

        const parsedURL = metadata.data.image.href; // Adjust this based on NFT.Storage response structure
        const ipfsCID = parsedURL.toString().split('://')[1];
        const jsonURL = `https://nftstorage.link/ipfs/${ipfsCID}`;

        console.log("Cleaned JSON URL:", jsonURL);
        return res.status(200).json({ cid: metadata.ipnft, url: jsonURL });

    } catch (error) {
        console.error("Error occurred during upload to IPFS:", error);
        return res.status(500).send('Error uploading to IPFS.');
    }
};


export const uploadData = (req: Request, res: Response) => {
    console.log('Processing data upload request...');

    if (!req.file) {
        console.error('No file received in the request.');
        return res.status(400).send('No file uploaded.');
    }

    let storagePath: string;

    switch (req.file.mimetype) {
        case 'image/png':
        case 'image/jpeg':
            storagePath = './uploads/images';
            break;
        case 'video/mp4':
            storagePath = './uploads/videos';
            break;
        case 'application/json':
            storagePath = './uploads/jsons';
            break;
        default:
            console.error(`Unsupported file type: ${req.file.mimetype}`);
            return res.status(400).send('Unsupported file type.');
    }

    if (!fs.existsSync(storagePath)) {
        console.log(`Directory ${storagePath} not found. Creating...`);
        fs.mkdirSync(storagePath, { recursive: true });
    }

    const filename = path.join(storagePath, `${Date.now()}-${req.file.originalname}`);
    console.log(`Saving file to ${filename}...`);

    fs.writeFile(filename, req.file.buffer, (err) => {
        if (err) {
            console.error('Error saving the file:', err);
            return res.status(500).send('Error saving the file.');
        }
        console.log('File saved successfully!');
        res.send('File saved successfully!');
    });
};
const uploadImageToIPFSInternal = async (file: Express.Multer.File): Promise<string> => {
    const metadata = await nftStorageClient.store({
        name: file.originalname,
        description: 'Realink asset',
        image: new File([file.buffer], file.originalname, { type: file.mimetype })
    });

    const parsedURL = metadata.data.image;
    const ipfsCID = parsedURL.toString().split('://')[1];
    return `https://nftstorage.link/ipfs/${ipfsCID}`;
};
export const createMetadataFromForm = async (req: Request, res: Response) => {
    try {
        // Step 1: Accept form data
        const { name, description, symbol, attributes, royalty, creator, share, external_url, properties, seller_fee_basis_points } = req.body;

        if (!req.file) {
            console.warn("No file found in the request.");
            return res.status(400).send('No file uploaded.');
        }
        let parsedProperties;
        let parsedAttributes;

        try {
            parsedProperties = properties ? JSON.parse(properties) : {};
            parsedAttributes = attributes ? JSON.parse(attributes) : [];

            console.log(`Parsed properties: ${JSON.stringify(parsedProperties)}`);
        } catch (error) {
            return res.status(400).send('Invalid JSON provided.');
        }

        console.log(`Preparing to upload file: ${req.file.originalname} to IPFS using NFT.Storage...`);

        // Step 2: Upload the image to IPFS
        const ipfsLink = await uploadImageToIPFSInternal(req.file);
        parsedProperties.files[0].uri = ipfsLink;
        // Step 3: Construct the metadata object
        const metadata = {
            name: name || 'Untitled',
            symbol: symbol || 'UNK',
            description: description || 'No description',
            seller_fee_basis_points: parseInt(seller_fee_basis_points),
            image: ipfsLink,
            attributes: attributes ? JSON.parse(attributes) : [],
            properties: parsedProperties,
            royalty: royalty || 0,
            creator: creator || 'Unknown',
            share: share || 100,
            external_url: external_url || 'https://www.example.com'
            // ... Add other properties as needed
        };

        // Step 4: Upload metadata to S3
        const s3Response = await uploadJSONToS3Internal(name, metadata);

        // Return the link to the metadata stored in S3
        res.send({ link: s3Response.Location });
    } catch (error) {
        const errorMessage = (error as Error).message;
        res.status(500).send(`Failed to create metadata: ${errorMessage}`);
    }

};
export const createMetadata = async (
    file: Express.Multer.File,
    name: string,
    description: string,
    symbol: string,
    attributes: string,
    royalty: string,
    creator: string,
    share: string,
    external_url: string,
    properties: string,
    seller_fee_basis_points: string
) => {
    console.log('[createMetadata] - Start');

    let parsedProperties;
    let parsedAttributes;

    try {
        parsedProperties = properties ? JSON.parse(properties) : {};
        parsedAttributes = attributes ? JSON.parse(attributes) : [];
    } catch (error) {
        console.error('[createMetadata] - Error parsing JSON:', error);
        throw new Error('Invalid JSON provided.');
    }

    console.log('[createMetadata] - Uploading image to IPFS');
    const ipfsLink = await uploadImageToIPFSInternal(file);
    console.log('[createMetadata] - Image uploaded to IPFS:', ipfsLink);

    parsedProperties.files[0].uri = ipfsLink;
    console.log("[createMetadata] - Input values:");
    console.log("name:", name);
    console.log("symbol:", symbol);
    console.log("description:", description);
    console.log("seller_fee_basis_points:", seller_fee_basis_points);
    console.log("ipfsLink:", ipfsLink);
    console.log("parsedAttributes:", JSON.stringify(parsedAttributes, null, 2));
    console.log("parsedProperties:", JSON.stringify(parsedProperties, null, 2));
    console.log("royalty:", royalty);
    console.log("creator:", creator);
    console.log("share:", share);
    console.log("external_url:", external_url);
    const metadata = {
        name: name || 'Untitled',
        symbol: symbol || 'UNK',
        description: description || 'No description',
        seller_fee_basis_points: parseInt(seller_fee_basis_points),
        image: ipfsLink,
        attributes: parsedAttributes,
        properties: parsedProperties,
        royalty: royalty || 0,
        creator: 'realink',
        share: share || 100,
        external_url: external_url || 'https://www.getrealink.com'
    };
    console.log("[createMetadata] - Constructed metadata:", JSON.stringify(metadata, null, 2));

    console.log('[createMetadata] - Uploading metadata to S3');
    const s3Response = await uploadJSONToS3Internal(name, metadata);
    console.log('[createMetadata] - Metadata uploaded to S3:', s3Response.Location);

    console.log('[createMetadata] - End');
    return { link: s3Response.Location };
};
