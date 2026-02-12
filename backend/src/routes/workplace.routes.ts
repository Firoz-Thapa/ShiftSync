import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sqlPool } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createLimiter } from '../middleware/rateLimiter';
import { PoolConnection } from 'mysql2/promise';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all workplaces for logged-in user
router.get('/', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    connection = await sqlPool.getConnection();
    const [result] = await connection.execute(
      'SELECT * FROM Workplaces WHERE userId = ? ORDER BY createdAt DESC',
      [req.userId]
    );

    const workplaces = result as any[];
    res.json({
      success: true,
      data: workplaces,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: workplaces.length,
        itemsPerPage: workplaces.length
      }
    });
  } catch (error: any) {
    console.error('Get workplaces error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workplaces',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get single workplace
router.get('/:id', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    connection = await sqlPool.getConnection();
    const [result] = await connection.execute(
      'SELECT * FROM Workplaces WHERE id = ? AND userId = ?',
      [req.params.id, req.userId]
    );

    const rows = result as any[];
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workplace not found'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error: any) {
    console.error('Get workplace error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workplace',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Create workplace
router.post(
  '/',
  createLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('color').matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    body('hourlyRate').isFloat({ min: 0 }).withMessage('Invalid hourly rate'),
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
        name, color, hourlyRate, address, contactInfo, notes,
        isRecurring, recurrencePattern, recurrenceEndDate
      } = req.body;
      
      connection = await sqlPool.getConnection();

      const [insertResult] = await connection.execute(
        `INSERT INTO Workplaces (userId, name, color, hourlyRate, address, contactInfo, notes, isRecurring, recurrencePattern, recurrenceEndDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          req.userId, name, color, hourlyRate, address || null, contactInfo || null, notes || null,
          isRecurring || false, recurrencePattern || null, recurrenceEndDate || null
        ]
      );

      const insertId = (insertResult as any).insertId;

      // Get the inserted workplace
      const [workplaces] = await connection.execute(
        'SELECT * FROM Workplaces WHERE id = ?',
        [insertId]
      );

      res.status(201).json({
        success: true,
        message: 'Workplace created successfully',
        data: (workplaces as any[])[0]
      });
    } catch (error: any) {
      console.error('Create workplace error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create workplace',
        error: error.message
      });
    } finally {
      if (connection) connection.release();
    }
  }
);

// Update workplace
router.put('/:id', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    const { 
      name, color, hourlyRate, address, contactInfo, notes,
      isRecurring, recurrencePattern, recurrenceEndDate
    } = req.body;
    
    connection = await sqlPool.getConnection();

    const [checkResult] = await connection.execute(
      'SELECT id FROM Workplaces WHERE id = ? AND userId = ?',
      [req.params.id, req.userId]
    );

    if ((checkResult as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workplace not found'
      });
    }

    await connection.execute(
      `UPDATE Workplaces 
       SET name = ?, color = ?, hourlyRate = ?, address = ?, contactInfo = ?, notes = ?, 
           isRecurring = ?, recurrencePattern = ?, recurrenceEndDate = ?, updatedAt = NOW()
       WHERE id = ?`,
      [
        name, color, hourlyRate, address || null, contactInfo || null, notes || null,
        isRecurring || false, recurrencePattern || null, recurrenceEndDate || null, req.params.id
      ]
    );

    const [workplaces] = await connection.execute(
      'SELECT * FROM Workplaces WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Workplace updated successfully',
      data: (workplaces as any[])[0]
    });
  } catch (error: any) {
    console.error('Update workplace error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workplace',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Delete workplace
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  let connection: PoolConnection | null = null;
  try {
    connection = await sqlPool.getConnection();

    const [checkResult] = await connection.execute(
      'SELECT id FROM Workplaces WHERE id = ? AND userId = ?',
      [req.params.id, req.userId]
    );

    if ((checkResult as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workplace not found'
      });
    }

    await connection.execute(
      'DELETE FROM Workplaces WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Workplace deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete workplace error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workplace',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

export default router;