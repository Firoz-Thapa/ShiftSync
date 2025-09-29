import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    res.json({ 
      status: 'unhealthy', 
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    data: { test: true }
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.originalUrl 
  });
});

app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

const startServer = async () => {
  try {
    console.log('Connecting to database...');
    await connectDatabase();
    
    app.listen(PORT, () => {
      console.log(`\nShiftSync Backend Server running on port ${PORT}`);
      console.log(`API Health Check: http://localhost:${PORT}/api/health`);
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