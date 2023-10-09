// routes/dataRoutes.ts

import express from 'express';
import multer from 'multer';
import * as dataController from '../../controllers/DataController/dataController';
import { uploadJSONToS3, fetchJSONFromS3 } from '../../controllers/DataController/s3Controller';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', upload.single('data'), dataController.uploadData);
router.post('/upload-image-to-IPFS', upload.single('data'), dataController.uploadDataToIPFS);
router.post('/upload-json-to-IPFS', dataController.uploadJSONToIPFS);
router.post('/upload-to-realink-bucket', uploadJSONToS3);
router.get('/fetch-from-realink-bucket', fetchJSONFromS3);
router.post('/create-metadata-from-form', upload.single('image'), dataController.createMetadataFromForm);

export default router;
