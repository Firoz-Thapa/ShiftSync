import rateLimit from 'express-rate-limit';
import { Request } from 'express';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, 
  legacyHeaders: false, 
  skip: (req: Request) => {
    return process.env.NODE_ENV === 'development' && 
           (req.ip === '127.0.0.1' || req.ip === '::1');
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, 
  message: {
    success: false,
    message: 'Too many items created, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});