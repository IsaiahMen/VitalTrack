// ------------------------
// VitalTrack Server.js
// ------------------------

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

// ------------------------
// App Setup
// ------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

// ------------------------
// Security Middleware
// ------------------------
app.set('trust proxy', 1);

// Helmet helps secure HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // disable CSP for now; can fine-tune later
  })
);

// CORS configuration — allows local dev & later Netlify
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://YOUR-NETLIFY-SITE.netlify.app'],
    credentials: true,
  })
);

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // change to true when deploying with HTTPS
    },
  })
);

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
});
app.use('/api/auth', authLimiter);

// ------------------------
// API Routes
// ------------------------
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/meals', mealRoutes);

// ------------------------
// Static Files (Frontend)
// ------------------------
app.use(express.static(path.join(__dirname, '..', 'public')));

// ------------------------
// Start Server
// ------------------------
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`✅ VitalTrack running on http://localhost:${port}`)
);
