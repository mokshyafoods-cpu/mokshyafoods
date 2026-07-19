import express from 'express';
import { getAdminToken } from '../controllers/dev';

const router = express.Router();

router.get('/admin-token', getAdminToken);

export default router;
