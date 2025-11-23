import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getLeaderboard, getUserProgress, addProgress, getBatchDetails, getStudentExercises, getExerciseDetails } from '../controllers/gameController.js';

const router = express.Router();

router.get('/leaderboard/:batch_id', authMiddleware, getLeaderboard);
router.get('/progress/me', authMiddleware, getUserProgress);
router.post('/progress/complete', authMiddleware, addProgress);
router.get('/batch/:batch_id/full', authMiddleware, getBatchDetails);
router.get('/exercises', authMiddleware, getStudentExercises);
router.get('/exercise/:id', authMiddleware, getExerciseDetails);

export default router;