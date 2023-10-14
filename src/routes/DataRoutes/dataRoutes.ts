// routes/dataRoutes.ts

import express from 'express';
import multer from 'multer';
import * as dataController from '../../controllers/DataController/dataController';
import { uploadJSONToS3, fetchJSONFromS3 } from '../../controllers/DataController/s3Controller';
import { authMiddleware, checkTokenBlacklist } from '../../middleware/auth';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', authMiddleware, checkTokenBlacklist, upload.single('data'), dataController.uploadData);
router.post('/upload-image-to-IPFS', authMiddleware, checkTokenBlacklist, upload.single('data'), dataController.uploadDataToIPFS);
router.post('/upload-json-to-IPFS', authMiddleware, checkTokenBlacklist, dataController.uploadJSONToIPFS);
router.post('/upload-to-realink-bucket', authMiddleware, checkTokenBlacklist, uploadJSONToS3);
router.get('/fetch-from-realink-bucket', authMiddleware, checkTokenBlacklist, fetchJSONFromS3);
router.post('/create-metadata-from-form', authMiddleware, checkTokenBlacklist, upload.single('image'), dataController.createMetadataFromForm);

export default router;
