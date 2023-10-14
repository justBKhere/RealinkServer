import express from 'express';
import multer from 'multer';
import * as dataController from '../../controllers/DataController/dataController';
import { uploadJSONToS3, fetchJSONFromS3 } from '../../controllers/DataController/s3Controller';
import { authMiddleware, checkTokenBlacklist } from '../../middleware/auth';
import { CreateProject, CreateRealinkAccessKey, CreateRealinkAccessKeyRemote } from '../../controllers/SolanaController/realinkController';
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/create-project', authMiddleware, checkTokenBlacklist, upload.single('image'), CreateProject);
router.post('/create-realink-access-key-self', authMiddleware, checkTokenBlacklist, CreateRealinkAccessKey);
router.post('/create-realink-access-key-remote', authMiddleware, checkTokenBlacklist, CreateRealinkAccessKeyRemote);

export { router as realinkEndpointRouter };