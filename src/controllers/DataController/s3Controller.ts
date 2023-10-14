import { Request, Response } from 'express';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
export const uploadJSONToS3Internal = async (name: string, data: any): Promise<any> => {
    const params = {
        Bucket: 'realink-s3-bucket',
        Key: `${name}.json`,
        Body: JSON.stringify(data),
        ContentType: 'application/json'
    };

    return new Promise((resolve, reject) => {
        s3.upload(params, (err: any, data: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

import { S3 } from 'aws-sdk';


export const DuplicateJsonToCustomUser = async (name: string, userSpecificName: string) => {
    try {
        const data = await s3.copyObject({
            Bucket: 'realink-s3-bucket',
            CopySource: `realink-s3-bucket/${name}.json`,
            Key: `${userSpecificName}.json`
        }).promise();  // Convert the request to a promise

        console.log(data);
        return `https://realink-s3-bucket.s3.amazonaws.com/${userSpecificName}.json`;
    } catch (err) {
        console.log(err);
        return null;
    }
}


export const fetchJSONFromS3Internal = async (filename: string): Promise<any> => {
    const params = {
        Bucket: 'realink-s3-bucket',
        Key: `${filename}.json`
    };

    return new Promise((resolve, reject) => {
        s3.getObject(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(data.Body!.toString()));
            }
        });
    });
};
// Upload JSON to S3
export const uploadJSONToS3 = async (req: Request, res: Response) => {
    const { name, data } = req.body;

    if (!name || !data) {
        return res.status(400).json({ error: true, message: 'Name and data are required.' });
    }

    const params = {
        Bucket: 'realink-s3-bucket',
        Key: `${name}.json`,
        Body: JSON.stringify(data),
        ContentType: 'application/json'
    };

    s3.upload(params, (err: any, data: any) => {
        if (err) {
            res.status(500).json({ error: true, message: err });
        } else {
            res.send({ data });
        }
    });
};

// Fetch JSON from S3
export const fetchJSONFromS3 = async (req: Request, res: Response) => {
    const filename = req.query.filename as string;

    if (!filename) {
        return res.status(400).send('Filename query parameter is required.');
    }

    const params = {
        Bucket: 'realink-s3-bucket',
        Key: `${filename}.json`
    };

    s3.getObject(params, (err, data) => {
        if (err) {
            console.log(err, err.stack);
            res.status(500).send(err);
        } else {
            res.send(JSON.parse(data.Body!.toString()));
        }
    });
};


// Rest of your functions (e.g., image upload and fetch) would remain as they are.
