import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sqlPool } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createLimiter } from '../middleware/rateLimiter';
import sql from 'mssql';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all study sessions for logged-in user with optional filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, subject, sessionType, priority, limit = 100 } = req.query;

    let query = 'SELECT * FROM StudySessions WHERE userId = @userId';
    const request = sqlPool.request();
    request.input('userId', sql.Int, req.userId);

    if (startDate) {
      query += ' AND startDatetime >= @startDate';
      request.input('startDate', sql.DateTime, startDate);
    }

    if (endDate) {
      query += ' AND startDatetime <= @endDate';
      request.input('endDate', sql.DateTime, endDate);
    }

    if (subject) {
      query += ' AND subject = @subject';
      request.input('subject', sql.NVarChar, subject);
    }

    if (sessionType) {
      query += ' AND sessionType = @sessionType';
      request.input('sessionType', sql.NVarChar, sessionType);
    }

    if (priority) {
      query += ' AND priority = @priority';
      request.input('priority', sql.NVarChar, priority);
    }

    query += ' ORDER BY startDatetime DESC';

    const result = await request.query(query);
    const sessions = result.recordset;

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
  }
});

// Get single study session
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('userId', sql.Int, req.userId)
      .query('SELECT * FROM StudySessions WHERE id = @id AND userId = @userId');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error: any) {
    console.error('Get study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study session',
      error: error.message
    });
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

      const insertResult = await sqlPool.request()
        .input('userId', sql.Int, req.userId)
        .input('title', sql.NVarChar, title)
        .input('subject', sql.NVarChar, subject || null)
        .input('startDatetime', sql.DateTime, startDatetime)
        .input('endDatetime', sql.DateTime, endDatetime)
        .input('location', sql.NVarChar, location || null)
        .input('sessionType', sql.NVarChar, sessionType || 'other')
        .input('priority', sql.NVarChar, priority || 'medium')
        .input('notes', sql.NVarChar, notes || null)
        .input('isRecurring', sql.Bit, isRecurring || false)
        .input('recurrencePattern', sql.NVarChar, recurrencePattern || null)
        .input('recurrenceEndDate', sql.DateTime, recurrenceEndDate || null)
        .query(`INSERT INTO StudySessions
         (userId, title, subject, startDatetime, endDatetime, location, sessionType, priority, notes, isRecurring, recurrencePattern, recurrenceEndDate, createdAt, updatedAt)
         OUTPUT INSERTED.*
         VALUES (@userId, @title, @subject, @startDatetime, @endDatetime, @location, @sessionType, @priority, @notes, @isRecurring, @recurrencePattern, @recurrenceEndDate, GETDATE(), GETDATE())`);

      res.status(201).json({
        success: true,
        message: 'Study session created successfully',
        data: insertResult.recordset[0]
      });
    } catch (error: any) {
      console.error('Create study session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create study session',
        error: error.message
      });
    }
  }
);

// Update study session
router.put('/:id', async (req: AuthRequest, res: Response) => {
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

    // Check if session exists and belongs to user
    const checkResult = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('userId', sql.Int, req.userId)
      .query('SELECT id FROM StudySessions WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    const updateResult = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('title', sql.NVarChar, title)
      .input('subject', sql.NVarChar, subject || null)
      .input('startDatetime', sql.DateTime, startDatetime)
      .input('endDatetime', sql.DateTime, endDatetime)
      .input('location', sql.NVarChar, location || null)
      .input('sessionType', sql.NVarChar, sessionType)
      .input('priority', sql.NVarChar, priority)
      .input('isCompleted', sql.Bit, isCompleted !== undefined ? isCompleted : false)
      .input('notes', sql.NVarChar, notes || null)
      .input('isRecurring', sql.Bit, isRecurring || false)
      .input('recurrencePattern', sql.NVarChar, recurrencePattern || null)
      .input('recurrenceEndDate', sql.DateTime, recurrenceEndDate || null)
      .query(`UPDATE StudySessions
       SET title = @title, subject = @subject, startDatetime = @startDatetime, endDatetime = @endDatetime, 
           location = @location, sessionType = @sessionType, priority = @priority, isCompleted = @isCompleted, 
           notes = @notes, isRecurring = @isRecurring, recurrencePattern = @recurrencePattern, 
           recurrenceEndDate = @recurrenceEndDate, updatedAt = GETDATE()
       OUTPUT INSERTED.*
       WHERE id = @id`);

    res.json({
      success: true,
      message: 'Study session updated successfully',
      data: updateResult.recordset[0]
    });
  } catch (error: any) {
    console.error('Update study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update study session',
      error: error.message
    });
  }
});

// Delete study session
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const checkResult = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('userId', sql.Int, req.userId)
      .query('SELECT id FROM StudySessions WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM StudySessions WHERE id = @id');

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
  }
});

// Mark as completed
router.put('/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('userId', sql.Int, req.userId)
      .query(`UPDATE StudySessions
       SET isCompleted = 1, updatedAt = GETDATE()
       WHERE id = @id AND userId = @userId`);

    const result = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('userId', sql.Int, req.userId)
      .query('SELECT * FROM StudySessions WHERE id = @id AND userId = @userId');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    res.json({
      success: true,
      message: 'Study session marked as completed',
      data: result.recordset[0]
    });
  } catch (error: any) {
    console.error('Complete study session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark study session as completed',
      error: error.message
    });
  }
});

export default router;
