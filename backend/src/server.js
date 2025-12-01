import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: allowedOrigin,
  credentials: true, 
}));

app.use('/api/auth', authRoutes);
app.use('/api', gameRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('French Gamification API is running');
});

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

export default app;