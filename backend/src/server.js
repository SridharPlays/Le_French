import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import path from 'path';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api', gameRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api', (req, res) => {
  res.send('French Gamification API is running');
});

const FRONTEND_DIST_PATH = path.join(process.cwd(), 'frontend', 'dist');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(FRONTEND_DIST_PATH));

  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST_PATH, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
