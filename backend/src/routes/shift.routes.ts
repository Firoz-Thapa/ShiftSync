import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sqlPool } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createLimiter } from '../middleware/rateLimiter';
import sql from 'mssql';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all shifts for logged-in user with optional filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, workplaceId, limit = 100 } = req.query;

    let query = `
      SELECT s.*, w.name as workplaceName, w.color as workplaceColor, w.hourlyRate as workplaceHourlyRate 
      FROM Shifts s
      LEFT JOIN Workplaces w ON s.workplaceId = w.id
      WHERE s.userId = @userId
    `;

    const request = sqlPool.request();
    request.input('userId', sql.Int, req.userId);

    if (startDate) {
      query += ' AND s.startDatetime >= @startDate';
      request.input('startDate', sql.DateTime, startDate);
    }

    if (endDate) {
      query += ' AND s.startDatetime <= @endDate';
      request.input('endDate', sql.DateTime, endDate);
    }

    if (workplaceId) {
      query += ' AND s.workplaceId = @workplaceId';
      request.input('workplaceId', sql.Int, workplaceId);
    }

    query += ' ORDER BY s.startDatetime DESC';

    const result = await request.query(query);

    // Transform to include workplace object
    const shifts = result.recordset.map(row => ({
      id: row.id,
      userId: row.userId,
      workplaceId: row.workplaceId,
      workplace: row.workplaceName ? {
        id: row.workplaceId,
        name: row.workplaceName,
        color: row.workplaceColor,
        hourlyRate: row.workplaceHourlyRate
      } : null,
      title: row.title,
      startDatetime: row.startDatetime,
      endDatetime: row.endDatetime,
      breakDuration: row.breakDuration,
      notes: row.notes,
      isConfirmed: row.isConfirmed,
      actualStartTime: row.actualStartTime,
      actualEndTime: row.actualEndTime,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    res.json({
      success: true,
      data: shifts,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: shifts.length,
        itemsPerPage: shifts.length
      }
    });
  } catch (error: any) {
    console.error('Get shifts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shifts',
      error: error.message
    });
  }
});

// Get single shift
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('userId', sql.Int, req.userId)
      .query(`SELECT s.*, w.name as workplaceName, w.color as workplaceColor, w.hourlyRate as workplaceHourlyRate
       FROM Shifts s
       LEFT JOIN Workplaces w ON s.workplaceId = w.id
       WHERE s.id = @id AND s.userId = @userId`);

    const rows = result.recordset;
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    const row = rows[0];
    const shift = {
      id: row.id,
      userId: row.userId,
      workplaceId: row.workplaceId,
      workplace: row.workplaceName ? {
        id: row.workplaceId,
        name: row.workplaceName,
        color: row.workplaceColor,
        hourlyRate: row.workplaceHourlyRate
      } : null,
      title: row.title,
      startDatetime: row.startDatetime,
      endDatetime: row.endDatetime,
      breakDuration: row.breakDuration,
      notes: row.notes,
      isConfirmed: row.isConfirmed,
      actualStartTime: row.actualStartTime,
      actualEndTime: row.actualEndTime,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };

    res.json({
      success: true,
      data: shift
    });
  } catch (error: any) {
    console.error('Get shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift',
      error: error.message
    });
  }
});

// Create shift
router.post(
  '/',
  createLimiter,
  [
    body('workplaceId').isInt({ min: 1 }).withMessage('Valid workplace ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('startDatetime').isISO8601().withMessage('Valid start datetime is required'),
    body('endDatetime').isISO8601().withMessage('Valid end datetime is required'),
    body('breakDuration').optional().isInt({ min: 0 }).withMessage('Invalid break duration'),
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

      const { workplaceId, title, startDatetime, endDatetime, breakDuration, notes, isConfirmed } = req.body;

      // Verify workplace belongs to user
      const workplaceCheck = await sqlPool.request()
        .input('workplaceId', sql.Int, workplaceId)
        .input('userId', sql.Int, req.userId)
        .query('SELECT id FROM Workplaces WHERE id = @workplaceId AND userId = @userId');

      if (workplaceCheck.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Workplace not found'
        });
      }

      const insertResult = await sqlPool.request()
        .input('userId', sql.Int, req.userId)
        .input('workplaceId', sql.Int, workplaceId)
        .input('title', sql.NVarChar, title)
        .input('startDatetime', sql.DateTime, startDatetime)
        .input('endDatetime', sql.DateTime, endDatetime)
        .input('breakDuration', sql.Int, breakDuration || 0)
        .input('notes', sql.NVarChar, notes || null)
        .input('isConfirmed', sql.Bit, isConfirmed || false)
        .query(`INSERT INTO Shifts (userId, workplaceId, title, startDatetime, endDatetime, breakDuration, notes, isConfirmed, createdAt, updatedAt)
         OUTPUT INSERTED.id
         VALUES (@userId, @workplaceId, @title, @startDatetime, @endDatetime, @breakDuration, @notes, @isConfirmed, GETDATE(), GETDATE())`);

      const insertId = insertResult.recordset[0].id;

      // Get the inserted shift
      const shifts = await sqlPool.request()
        .input('id', sql.Int, insertId)
        .query('SELECT s.*, w.name as workplaceName, w.color as workplaceColor, w.hourlyRate as workplaceHourlyRate FROM Shifts s LEFT JOIN Workplaces w ON s.workplaceId = w.id WHERE s.id = @id');

      res.status(201).json({
        success: true,
        message: 'Shift created successfully',
        data: shifts.recordset[0]
      });
    } catch (error: any) {
      console.error('Create shift error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create shift',
        error: error.message
      });
    }
  }
);

// Update shift
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { workplaceId, title, startDatetime, endDatetime, breakDuration, notes, isConfirmed } = req.body;

    // Check if shift exists and belongs to user
    const checkResult = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('userId', sql.Int, req.userId)
      .query('SELECT id FROM Shifts WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('workplaceId', sql.Int, workplaceId)
      .input('title', sql.NVarChar, title)
      .input('startDatetime', sql.DateTime, startDatetime)
      .input('endDatetime', sql.DateTime, endDatetime)
      .input('breakDuration', sql.Int, breakDuration)
      .input('notes', sql.NVarChar, notes || null)
      .input('isConfirmed', sql.Bit, isConfirmed)
      .query(`UPDATE Shifts
       SET workplaceId = @workplaceId, title = @title, startDatetime = @startDatetime, endDatetime = @endDatetime, breakDuration = @breakDuration, notes = @notes, isConfirmed = @isConfirmed, updatedAt = GETDATE()
       WHERE id = @id`);

    // Get updated shift with workplace details
    const shifts = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT s.*, w.name as workplaceName, w.color as workplaceColor, w.hourlyRate as workplaceHourlyRate
       FROM Shifts s
       LEFT JOIN Workplaces w ON s.workplaceId = w.id
       WHERE s.id = @id`);

    res.json({
      success: true,
      message: 'Shift updated successfully',
      data: shifts.recordset[0]
    });
  } catch (error: any) {
    console.error('Update shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shift',
      error: error.message
    });
  }
});

// Delete shift
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const checkResult = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('userId', sql.Int, req.userId)
      .query('SELECT id FROM Shifts WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Shifts WHERE id = @id');

    res.json({
      success: true,
      message: 'Shift deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shift',
      error: error.message
    });
  }
});

// Confirm shift
router.put('/:id/confirm', async (req: AuthRequest, res: Response) => {
  try {
    await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('userId', sql.Int, req.userId)
      .query(`UPDATE Shifts
       SET isConfirmed = 1, updatedAt = GETDATE()
       WHERE id = @id AND userId = @userId`);

    const result = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('userId', sql.Int, req.userId)
      .query('SELECT * FROM Shifts WHERE id = @id AND userId = @userId');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    res.json({
      success: true,
      message: 'Shift confirmed successfully',
      data: result.recordset[0]
    });
  } catch (error: any) {
    console.error('Confirm shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm shift',
      error: error.message
    });
  }
});

// Clock in
router.put('/:id/clock-in', async (req: AuthRequest, res: Response) => {
  try {
    const result = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('userId', sql.Int, req.userId)
      .query(`UPDATE Shifts
       SET actualStartTime = GETDATE(), updatedAt = GETDATE()
       WHERE id = @id AND userId = @userId AND actualStartTime IS NULL`);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot clock in - shift not found or already clocked in'
      });
    }

    const shifts = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Shifts WHERE id = @id');

    res.json({
      success: true,
      message: 'Clocked in successfully',
      data: shifts.recordset[0]
    });
  } catch (error: any) {
    console.error('Clock in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock in',
      error: error.message
    });
  }
});

// Clock out
router.put('/:id/clock-out', async (req: AuthRequest, res: Response) => {
  try {
    const result = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('userId', sql.Int, req.userId)
      .query(`UPDATE Shifts
       SET actualEndTime = GETDATE(), updatedAt = GETDATE()
       WHERE id = @id AND userId = @userId AND actualStartTime IS NOT NULL AND actualEndTime IS NULL`);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot clock out - shift not found or not clocked in'
      });
    }

    const shifts = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Shifts WHERE id = @id');

    res.json({
      success: true,
      message: 'Clocked out successfully',
      data: shifts.recordset[0]
    });
  } catch (error: any) {
    console.error('Clock out error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock out',
      error: error.message
    });
  }
});

export default router;
