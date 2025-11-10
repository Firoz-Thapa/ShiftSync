import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sqlPool } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all study sessions for logged-in user with optional filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, subject, sessionType, priority, limit = 100 } = req.query;
    const pool = await sqlPool;

    let query = 'SELECT * FROM StudySessions WHERE userId = @userId';
    const request = pool.request().input('userId', req.userId);

    if (startDate) {
      query += ' AND startDatetime >= @startDate';
      request.input('startDate', startDate);
    }

    if (endDate) {
      query += ' AND startDatetime <= @endDate';
      request.input('endDate', endDate);
    }

    if (subject) {
      query += ' AND subject = @subject';
      request.input('subject', subject);
    }

    if (sessionType) {
      query += ' AND sessionType = @sessionType';
      request.input('sessionType', sessionType);
    }

    if (priority) {
      query += ' AND priority = @priority';
      request.input('priority', priority);
    }

    query += ' ORDER BY startDatetime DESC';

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: result.recordset.length,
        itemsPerPage: result.recordset.length
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
    const pool = await sqlPool;
    const result = await pool.request()
      .input('id', req.params.id)
      .input('userId', req.userId)
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
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('startDatetime').isISO8601().withMessage('Valid start datetime is required'),
    body('endDatetime').isISO8601().withMessage('Valid end datetime is required'),
    body('sessionType').optional().isIn(['lecture', 'exam', 'assignment', 'study_group', 'lab', 'other']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
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
        notes 
      } = req.body;
      
      const pool = await sqlPool;

      const result = await pool.request()
        .input('userId', req.userId)
        .input('title', title)
        .input('subject', subject || null)
        .input('startDatetime', startDatetime)
        .input('endDatetime', endDatetime)
        .input('location', location || null)
        .input('sessionType', sessionType || 'other')
        .input('priority', priority || 'medium')
        .input('notes', notes || null)
        .query(`
          INSERT INTO StudySessions 
          (userId, title, subject, startDatetime, endDatetime, location, sessionType, priority, notes)
          OUTPUT INSERTED.*
          VALUES (@userId, @title, @subject, @startDatetime, @endDatetime, @location, @sessionType, @priority, @notes)
        `);

      res.status(201).json({
        success: true,
        message: 'Study session created successfully',
        data: result.recordset[0]
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
      notes 
    } = req.body;
    
    const pool = await sqlPool;

    // Check if session exists and belongs to user
    const checkResult = await pool.request()
      .input('id', req.params.id)
      .input('userId', req.userId)
      .query('SELECT id FROM StudySessions WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    const result = await pool.request()
      .input('id', req.params.id)
      .input('title', title)
      .input('subject', subject || null)
      .input('startDatetime', startDatetime)
      .input('endDatetime', endDatetime)
      .input('location', location || null)
      .input('sessionType', sessionType)
      .input('priority', priority)
      .input('isCompleted', isCompleted !== undefined ? isCompleted : false)
      .input('notes', notes || null)
      .query(`
        UPDATE StudySessions 
        SET title = @title,
            subject = @subject,
            startDatetime = @startDatetime,
            endDatetime = @endDatetime,
            location = @location,
            sessionType = @sessionType,
            priority = @priority,
            isCompleted = @isCompleted,
            notes = @notes,
            updatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Study session updated successfully',
      data: result.recordset[0]
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
    const pool = await sqlPool;

    const checkResult = await pool.request()
      .input('id', req.params.id)
      .input('userId', req.userId)
      .query('SELECT id FROM StudySessions WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found'
      });
    }

    await pool.request()
      .input('id', req.params.id)
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
    const pool = await sqlPool;

    const result = await pool.request()
      .input('id', req.params.id)
      .input('userId', req.userId)
      .query(`
        UPDATE StudySessions 
        SET isCompleted = 1,
            updatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id AND userId = @userId
      `);

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