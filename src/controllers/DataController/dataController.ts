// controllers/dataController.ts

import { Request, Response } from 'express';
import { NFTStorage, File } from 'nft.storage';
import { uploadJSONToS3Internal, fetchJSONFromS3Internal } from './s3Controller';
import fs from 'fs';
import path from 'path';

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

