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

// Get all shifts for logged-in user with optional filters
router.get('/', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    const { startDate, endDate, workplaceId, limit = 100 } = req.query;
    connection = await sqlPool.getConnection();

    let query = `
      SELECT s.*, w.name as workplaceName, w.color as workplaceColor, w.hourlyRate as workplaceHourlyRate
      FROM Shifts s
      LEFT JOIN Workplaces w ON s.workplaceId = w.id
      WHERE s.userId = ?
    `;

    const params: any[] = [req.userId];

    if (startDate) {
      query += ' AND s.startDatetime >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND s.startDatetime <= ?';
      params.push(endDate);
    }

    if (workplaceId) {
      query += ' AND s.workplaceId = ?';
      params.push(workplaceId);
    }

    query += ' ORDER BY s.startDatetime DESC';

    const [result] = await connection.execute(query, params);

    // Transform to include workplace object
    const shifts = (result as any[]).map(row => ({
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
  } finally {
    if (connection) connection.release();
  }
});

// Get single shift
router.get('/:id', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    connection = await sqlPool.getConnection();
    const [result] = await connection.execute(
      `SELECT s.*, w.name as workplaceName, w.color as workplaceColor, w.hourlyRate as workplaceHourlyRate
       FROM Shifts s
       LEFT JOIN Workplaces w ON s.workplaceId = w.id
       WHERE s.id = ? AND s.userId = ?`,
      [req.params.id, req.userId]
    );

    const rows = result as any[];
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
  } finally {
    if (connection) connection.release();
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

      const { workplaceId, title, startDatetime, endDatetime, breakDuration, notes, isConfirmed } = req.body;
      connection = await sqlPool.getConnection();

      // Verify workplace belongs to user
      const [workplaceCheck] = await connection.execute(
        'SELECT id FROM Workplaces WHERE id = ? AND userId = ?',
        [workplaceId, req.userId]
      );

      if ((workplaceCheck as any[]).length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Workplace not found'
        });
      }

      const [insertResult] = await connection.execute(
        `INSERT INTO Shifts (userId, workplaceId, title, startDatetime, endDatetime, breakDuration, notes, isConfirmed, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [req.userId, workplaceId, title, startDatetime, endDatetime, breakDuration || 0, notes || null, isConfirmed || false]
      );

      const insertId = (insertResult as any).insertId;

      // Get the inserted shift
      const [shifts] = await connection.execute(
        'SELECT s.*, w.name as workplaceName, w.color as workplaceColor, w.hourlyRate as workplaceHourlyRate FROM Shifts s LEFT JOIN Workplaces w ON s.workplaceId = w.id WHERE s.id = ?',
        [insertId]
      );

      const shift = (shifts as any[])[0];

      res.status(201).json({
        success: true,
        message: 'Shift created successfully',
        data: shift
      });
    } catch (error: any) {
      console.error('Create shift error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create shift',
        error: error.message
      });
    } finally {
      if (connection) connection.release();
    }
  }
);

// Update shift
router.put('/:id', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    const { workplaceId, title, startDatetime, endDatetime, breakDuration, notes, isConfirmed } = req.body;
    connection = await sqlPool.getConnection();

    // Check if shift exists and belongs to user
    const [checkResult] = await connection.execute(
      'SELECT id FROM Shifts WHERE id = ? AND userId = ?',
      [req.params.id, req.userId]
    );

    if ((checkResult as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    await connection.execute(
      `UPDATE Shifts 
       SET workplaceId = ?, title = ?, startDatetime = ?, endDatetime = ?, breakDuration = ?, notes = ?, isConfirmed = ?, updatedAt = NOW()
       WHERE id = ?`,
      [workplaceId, title, startDatetime, endDatetime, breakDuration, notes || null, isConfirmed, req.params.id]
    );

    // Get updated shift with workplace details
    const [shifts] = await connection.execute(
      `SELECT s.*, w.name as workplaceName, w.color as workplaceColor, w.hourlyRate as workplaceHourlyRate 
       FROM Shifts s
       LEFT JOIN Workplaces w ON s.workplaceId = w.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    const shift = (shifts as any[])[0];

    res.json({
      success: true,
      message: 'Shift updated successfully',
      data: shift
    });
  } catch (error: any) {
    console.error('Update shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shift',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Delete shift
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    connection = await sqlPool.getConnection();

    const [checkResult] = await connection.execute(
      'SELECT id FROM Shifts WHERE id = ? AND userId = ?',
      [req.params.id, req.userId]
    );

    if ((checkResult as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    await connection.execute(
      'DELETE FROM Shifts WHERE id = ?',
      [req.params.id]
    );

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
  } finally {
    if (connection) connection.release();
  }
});

// Confirm shift
router.put('/:id/confirm', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    connection = await sqlPool.getConnection();

    await connection.execute(
      `UPDATE Shifts 
       SET isConfirmed = true, updatedAt = NOW()
       WHERE id = ? AND userId = ?`,
      [req.params.id, req.userId]
    );

    const [result] = await connection.execute(
      'SELECT * FROM Shifts WHERE id = ? AND userId = ?',
      [req.params.id, req.userId]
    );

    if ((result as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    res.json({
      success: true,
      message: 'Shift confirmed successfully',
      data: (result as any[])[0]
    });
  } catch (error: any) {
    console.error('Confirm shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm shift',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Clock in
router.put('/:id/clock-in', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    connection = await sqlPool.getConnection();

    const [result] = await connection.execute(
      `UPDATE Shifts 
       SET actualStartTime = NOW(), updatedAt = NOW()
       WHERE id = ? AND userId = ? AND actualStartTime IS NULL`,
      [req.params.id, req.userId]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot clock in - shift not found or already clocked in'
      });
    }

    const [shifts] = await connection.execute(
      'SELECT * FROM Shifts WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Clocked in successfully',
      data: (shifts as any[])[0]
    });
  } catch (error: any) {
    console.error('Clock in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock in',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Clock out
router.put('/:id/clock-out', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    connection = await sqlPool.getConnection();

    const [result] = await connection.execute(
      `UPDATE Shifts 
       SET actualEndTime = NOW(), updatedAt = NOW()
       WHERE id = ? AND userId = ? AND actualStartTime IS NOT NULL AND actualEndTime IS NULL`,
      [req.params.id, req.userId]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot clock out - shift not found or not clocked in'
      });
    }

    const [shifts] = await connection.execute(
      'SELECT * FROM Shifts WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Clocked out successfully',
      data: (shifts as any[])[0]
    });
  } catch (error: any) {
    console.error('Clock out error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock out',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

export default router;