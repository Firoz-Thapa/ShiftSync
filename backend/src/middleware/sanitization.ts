import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

// XSS options configuration
const xssOptions = {
  whiteList: {}, // Empty whitelist = strip all HTML
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

/**
 * Recursively sanitize an object/array
 */
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return xss(value, xssOptions);
  }
  
  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item));
  }
  
  if (value !== null && typeof value === 'object') {
    const sanitized: any = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        sanitized[key] = sanitizeValue(value[key]);
      }
    }
    return sanitized;
  }
  
  return value;
}

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body) {
      req.body = sanitizeValue(req.body);
    }
    
    if (req.query) {
      req.query = sanitizeValue(req.query);
    }
    
    if (req.params) {
      req.params = sanitizeValue(req.params);
    }
    
    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid input data',
    });
  }
};

export const validateNoSQLInjection = (req: Request, res: Response, next: NextFunction) => {
  const checkForInjection = (obj: any): boolean => {
    if (typeof obj === 'string') {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
        /(;|\-\-|\/\*|\*\/)/,
        /(\bOR\b.*=.*)/i,
        /(\bAND\b.*=.*)/i,
      ];
      
      return sqlPatterns.some(pattern => pattern.test(obj));
    }
    
    if (Array.isArray(obj)) {
      return obj.some(item => checkForInjection(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
      return Object.values(obj).some(value => checkForInjection(value));
    }
    
    return false;
  };
  
  const hasInjection = 
    checkForInjection(req.body) ||
    checkForInjection(req.query) ||
    checkForInjection(req.params);
  
  if (hasInjection) {
    console.warn(`⚠️  Potential SQL injection attempt from IP: ${req.ip}`);
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected',
    });
  }
  
  next();
};