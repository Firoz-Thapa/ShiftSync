import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { apiLimiter } from './middleware/rateLimiter';
import { sanitizeInput, validateNoSQLInjection } from './middleware/sanitization';
import { securityHeaders, parameterPollutionProtection } from './middleware/security';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import workplaceRoutes from './routes/workplace.routes';
import shiftRoutes from './routes/shift.routes';
import studySessionRoutes from './routes/studySession.routes';

dotenv.config();

const app = express();
const PORT = env.PORT;


app.use(helmet());
app.use(securityHeaders); 
app.use(cors({
  origin: env.CORS_ORIGIN, 
  credentials: true,
}));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' })); 

app.use(parameterPollutionProtection);
app.use(sanitizeInput);
app.use(validateNoSQLInjection); 


app.use('/api/', apiLimiter);

app.use((req: any, res, next) => {
  req.id = Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.id);
  next();
});

app.use((req: any, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] [${req.id}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const pool = await connectDatabase();
    const result = await pool.request().query('SELECT 1 as test');
    const dbConnected = result.recordset.length > 0;
    
    res.json({ 
      status: 'healthy', 
      message: 'ShiftSync API is running!',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workplaces', workplaceRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/study-sessions', studySessionRoutes);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    data: { test: true }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('Connecting to database...');
    await connectDatabase();
    
    app.listen(PORT, () => {
      console.log(`\nShiftSync Backend Server running on port ${PORT}`);
      console.log(`API Health Check: http://localhost:${PORT}/api/health`);
      console.log(`Auth endpoints: http://localhost:${PORT}/api/auth/login`);
      console.log(`Auth endpoints: http://localhost:${PORT}/api/auth/register`);
      console.log(`Workplace endpoints: http://localhost:${PORT}/api/workplaces`);
      console.log(`Shift endpoints: http://localhost:${PORT}/api/shifts`);
      console.log(`Study Session endpoints: http://localhost:${PORT}/api/study-sessions`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});