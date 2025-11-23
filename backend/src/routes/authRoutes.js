import express from 'express';
import { registerUser, loginUser, getBatches, getMe, logoutUser } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/batches', getBatches);
router.get('/me', authMiddleware, getMe);
router.post('/logout', logoutUser);

export default router;