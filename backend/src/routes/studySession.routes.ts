import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sqlPool } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createLimiter } from '../middleware/rateLimiter';
import { PoolConnection } from 'mysql2/promise';
import { create } from 'domain';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all study sessions for logged-in user with optional filters
router.get('/', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    const { startDate, endDate, subject, sessionType, priority, limit = 100 } = req.query;
    connection = await sqlPool.getConnection();

    let query = 'SELECT * FROM StudySessions WHERE userId = ?';
    const params: any[] = [req.userId];

    if (startDate) {
      query += ' AND startDatetime >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND startDatetime <= ?';
      params.push(endDate);
    }

    if (subject) {
      query += ' AND subject = ?';
      params.push(subject);
    }

    if (sessionType) {
      query += ' AND sessionType = ?';
      params.push(sessionType);
    }

    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY startDatetime DESC';

    const [result] = await connection.execute(query, params);

    const sessions = result as any[];
    res.json({
      success: true,
      data: sessions,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: sessions.length,
        itemsPerPage: sessions.length
      }
    });
  } catch (error: any) {
    console.error('Get study sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study sessions',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get single study session
router.get('/:id', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    connection = await sqlPool.getConnection();
    const [result] = await connection.execute(
      'SELECT * FROM StudySessions WHERE id = ? AND userId = ?',
      [req.params.id, req.userId]
    );

    const rows = result as any[];
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error: any) {
    console.error('Get study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study session',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Create study session
router.post(
  '/',
  createLimiter,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('startDatetime').isISO8601().withMessage('Valid start datetime is required'),
    body('endDatetime').isISO8601().withMessage('Valid end datetime is required'),
    body('sessionType').optional().isIn(['lecture', 'exam', 'assignment', 'study_group', 'lab', 'other']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('isRecurring').optional().isBoolean().withMessage('isRecurring must be a boolean'),
    body('recurrencePattern').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid recurrence pattern'),
  ],
  async (req: AuthRequest, res: Response) => {
    let connection: PoolConnection | null = null;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { 
        title, 
        subject, 
        startDatetime, 
        endDatetime, 
        location, 
        sessionType, 
        priority, 
        notes,
        isRecurring,
        recurrencePattern,
        recurrenceEndDate
      } = req.body;
      
      connection = await sqlPool.getConnection();

      const [insertResult] = await connection.execute(
        `INSERT INTO StudySessions 
         (userId, title, subject, startDatetime, endDatetime, location, sessionType, priority, notes, isRecurring, recurrencePattern, recurrenceEndDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [req.userId, title, subject || null, startDatetime, endDatetime, location || null, sessionType || 'other', priority || 'medium', notes || null, isRecurring || false, recurrencePattern || null, recurrenceEndDate || null]
      );

      const insertId = (insertResult as any).insertId;

      const [sessions] = await connection.execute(
        'SELECT * FROM StudySessions WHERE id = ?',
        [insertId]
      );

      res.status(201).json({
        success: true,
        message: 'Study session created successfully',
        data: (sessions as any[])[0]
      });
    } catch (error: any) {
      console.error('Create study session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create study session',
        error: error.message
      });
    } finally {
      if (connection) connection.release();
    }
  }
);

// Update study session
router.put('/:id', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    const { 
      title, 
      subject, 
      startDatetime, 
      endDatetime, 
      location, 
      sessionType, 
      priority, 
      isCompleted,
      notes,
      isRecurring,
      recurrencePattern,
      recurrenceEndDate
    } = req.body;
    
    connection = await sqlPool.getConnection();

    // Check if session exists and belongs to user
    const [checkResult] = await connection.execute(
      'SELECT id FROM StudySessions WHERE id = ? AND userId = ?',
      [req.params.id, req.userId]
    );

    if ((checkResult as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    await connection.execute(
      `UPDATE StudySessions 
       SET title = ?, subject = ?, startDatetime = ?, endDatetime = ?, location = ?, sessionType = ?, priority = ?, isCompleted = ?, notes = ?, isRecurring = ?, recurrencePattern = ?, recurrenceEndDate = ?, updatedAt = NOW()
       WHERE id = ?`,
      [title, subject || null, startDatetime, endDatetime, location || null, sessionType, priority, isCompleted !== undefined ? isCompleted : false, notes || null, isRecurring || false, recurrencePattern || null, recurrenceEndDate || null, req.params.id]
    );

    const [sessions] = await connection.execute(
      'SELECT * FROM StudySessions WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Study session updated successfully',
      data: (sessions as any[])[0]
    });
  } catch (error: any) {
    console.error('Update study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update study session',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Delete study session
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    connection = await sqlPool.getConnection();

    const [checkResult] = await connection.execute(
      'SELECT id FROM StudySessions WHERE id = ? AND userId = ?',
      [req.params.id, req.userId]
    );

    if ((checkResult as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    await connection.execute(
      'DELETE FROM StudySessions WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Study session deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete study session',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Mark as completed
router.put('/:id/complete', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    connection = await sqlPool.getConnection();

    const [result] = await connection.execute(
      `UPDATE StudySessions 
       SET isCompleted = true, updatedAt = NOW()
       WHERE id = ? AND userId = ?`,
      [req.params.id, req.userId]
    );

    const [sessions] = await connection.execute(
      'SELECT * FROM StudySessions WHERE id = ? AND userId = ?',
      [req.params.id, req.userId]
    );

    const rows = sessions as any[];
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    res.json({
      success: true,
      message: 'Study session marked as completed',
      data: rows[0]
    });
  } catch (error: any) {
    console.error('Complete study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark study session as completed',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

export default router;