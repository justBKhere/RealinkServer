import { S3 } from 'aws-sdk';
import { APIGatewayEvent, Context, APIGatewayProxyResult } from 'aws-lambda';

const s3 = new S3();

interface UploadBody {
    filename: string;
    metadata: any;
}

export const uploadToRealinkBucket = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    const body: UploadBody = JSON.parse(event.body!); // Ensure event.body is not null
    const { filename, metadata } = body;

    const s3Params: S3.PutObjectRequest = {
        Bucket: 'realink-s3-bucket',
        Key: filename,
        Body: JSON.stringify(metadata)
    };

    try {
        await s3.putObject(s3Params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Upload successful." })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Upload failed.", error })
        };
    }
};

export const fetchFromRealinkBucket = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    const filename = event.pathParameters!.filename; // Ensure pathParameters is not null
    if (!filename) {
        // Handle the error, maybe return an error response or throw an exception
        throw new Error('Filename is not defined.');
    }
    else {
        const s3Params: S3.GetObjectRequest = {
            Bucket: 'realink-s3-bucket',
            Key: filename
        };


        try {
            const file = await s3.getObject(s3Params).promise();

            return {
                statusCode: 200,
                body: file.Body!.toString('utf-8'), // Assuming the file is a utf-8 encoded text file
                headers: {
                    'Content-Type': 'text/plain' // or whichever mime type your file has
                }
            };
        } catch (error) {
            return {
                statusCode: 500,
                body: 'Failed to fetch the file.'
            };
        }
    }
};
