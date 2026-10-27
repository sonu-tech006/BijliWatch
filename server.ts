import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectToDatabase } from './server/db/connection.js';
import { initializeSeedData } from './server/db/store.js';

import authRouter from './server/routes/auth.js';
import connectionsRouter from './server/routes/connections.js';
import readingsRouter from './server/routes/readings.js';
import billsRouter from './server/routes/bills.js';
import complaintsRouter from './server/routes/complaints.js';
import analyticsRouter from './server/routes/analytics.js';
import adminRouter from './server/routes/admin.js';
import uploadRouter from './server/routes/upload.js';
import notificationsRouter from './server/routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // JSON Body Parser with 20MB limit for bill/photo data URLs
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Initialize DB & Seed Data
  await connectToDatabase();
  await initializeSeedData();

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/connections', connectionsRouter);
  app.use('/api/readings', readingsRouter);
  app.use('/api/bills', billsRouter);
  app.use('/api/complaints', complaintsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/notifications', notificationsRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'BijliWatch Utility Engine',
      timestamp: new Date().toISOString(),
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite middleware in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[BijliWatch Server] Running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[BijliWatch Server] Fatal startup error:', err);
});
