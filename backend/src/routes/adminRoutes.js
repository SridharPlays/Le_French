import express from 'express';
import { authMiddleware } from '../middleware/auth.js'; // Ensure this adds role to req.user
import { createChapter, createExercise, toggleChapterLock, getStudentProgress, getChapters } from '../controllers/adminController.js';

const router = express.Router();

const verifyAdmin = (req, res, next) => {
    if(req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({msg: "Access Denied: Admins only"});
    }
};

router.post('/chapter', authMiddleware, verifyAdmin, createChapter);
router.post('/exercise', authMiddleware, verifyAdmin, createExercise);
router.post('/lock', authMiddleware, verifyAdmin, toggleChapterLock);
router.get('/stats', authMiddleware, verifyAdmin, getStudentProgress);
router.get('/chapters_list', authMiddleware, getChapters);

export default router;