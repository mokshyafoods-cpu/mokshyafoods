import express from 'express';
import { createContactMessage, getAllMessages, updateMessageStatus } from '../controllers/contact';
import { adminMiddleware } from '../middleware/auth';
import { contactMessageValidator, updateMessageStatusValidator, validateRequest } from '../middleware/validation';

const router = express.Router();

router.post('/', contactMessageValidator, validateRequest, createContactMessage);
router.get('/', adminMiddleware, getAllMessages);
router.put('/:id', adminMiddleware, updateMessageStatusValidator, validateRequest, updateMessageStatus);

export default router;
