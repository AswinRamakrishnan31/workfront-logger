import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import authenticate from './middleware/auth.js';
import errorHandler from './middleware/errorHandler.js';

import projectRoutes from './routes/projectRoutes.js';
import capacityRoutes from './routes/capacityRoutes.js';
import dropdownRoutes from './routes/dropdownRoutes.js';
import migrationRoutes from './routes/migrationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import dbAdminRoutes from './routes/dbAdminRoutes.js';

const app = express();

// Security and performance middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global SSO / authentication middleware
app.use(authenticate);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected'
  });
});

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/capacity', capacityRoutes);
app.use('/api/dropdowns', dropdownRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/admin', userRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/db-admin', dbAdminRoutes);

// Centralized error handler
app.use(errorHandler);

export default app;
