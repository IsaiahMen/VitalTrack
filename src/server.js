// ----------------------
// VitalTrack Server.js
// ----------------------

import dotenv from 'dotenv/config';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './auth.js';
import workoutRoutes from './workouts.js';
import mealRoutes from './meals.js';

// ----------------------
// Setup
// ----------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1); // Needed for HTTPS & sessions on Render
app.use(express.json());

// Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// ----------------------
// CORS (Render only)
// ----------------------
app.use(
  cors({
    origin: [
      'https://vitaltrack.onrender.com', // Render live backend
      'https://vitaltrack.app',          // Your custom domain
      'https://www.vitaltrack.app'       // Optional www
    ],
    credentials: true,
  })
);

// ----------------------
// Sessions
// ----------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd, // true on Render (HTTPS)
    },
  })
);

// ----------------------
// Rate Limiter
// ----------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/auth', authLimiter);

// ----------------------
// Health Check (for Render)
// ----------------------
app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true });
});

// ----------------------
// API Routes
// ----------------------
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/meals', mealRoutes);

// ----------------------
// Serve Frontend (Static Files)
// ----------------------
app.use(express.static(path.join(__dirname, '..', 'public')));

// ----------------------
// Start Server
// ----------------------
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ VitalTrack running on port ${port}`);
});
