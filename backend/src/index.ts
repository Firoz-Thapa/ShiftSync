import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'ShiftSync API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    data: { test: true }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: 1,
        email: email,
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      token: 'mock-jwt-token-' + Date.now()
    }
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

// Basic error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

app.listen(PORT, () => {
  console.log(`ShiftSync Backend Server running on port ${PORT}`);
  console.log(`API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`API Test: http://localhost:${PORT}/api/test`);
  console.log(`Mock Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
}); 