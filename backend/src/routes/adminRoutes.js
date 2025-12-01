import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createChapter, createExercise, toggleChapterLock, getStudentProgress, getChapters, getStudentHistory, getBatchAccess, createStudyMaterial } from '../controllers/adminController.js';

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
router.get('/student/:id', authMiddleware, verifyAdmin, getStudentHistory);
router.get('/access_map', authMiddleware, verifyAdmin, getBatchAccess);
router.post('/study_material', authMiddleware, verifyAdmin, createStudyMaterial);

export default router;