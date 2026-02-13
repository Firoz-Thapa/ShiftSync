import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sqlPool } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createLimiter } from '../middleware/rateLimiter';
import sql from 'mssql';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all workplaces for logged-in user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await sqlPool.request()
      .input('userId', sql.Int, req.userId)
      .query('SELECT * FROM Workplaces WHERE userId = @userId ORDER BY createdAt DESC');

    const workplaces = result.recordset;
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
  }
});

// Get single workplace
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('userId', sql.Int, req.userId)
      .query('SELECT * FROM Workplaces WHERE id = @id AND userId = @userId');

    const rows = result.recordset;
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

      const insertResult = await sqlPool.request()
        .input('userId', sql.Int, req.userId)
        .input('name', sql.NVarChar, name)
        .input('color', sql.NVarChar, color)
        .input('hourlyRate', sql.Decimal(10, 2), hourlyRate)
        .input('address', sql.NVarChar, address || null)
        .input('contactInfo', sql.NVarChar, contactInfo || null)
        .input('notes', sql.NVarChar, notes || null)
        .input('isRecurring', sql.Bit, isRecurring || false)
        .input('recurrencePattern', sql.NVarChar, recurrencePattern || null)
        .input('recurrenceEndDate', sql.DateTime, recurrenceEndDate || null)
        .query(`
          INSERT INTO Workplaces (userId, name, color, hourlyRate, address, contactInfo, notes, isRecurring, recurrencePattern, recurrenceEndDate, createdAt, updatedAt)
          OUTPUT INSERTED.*
          VALUES (@userId, @name, @color, @hourlyRate, @address, @contactInfo, @notes, @isRecurring, @recurrencePattern, @recurrenceEndDate, GETDATE(), GETDATE())
        `);

      res.status(201).json({
        success: true,
        message: 'Workplace created successfully',
        data: insertResult.recordset[0]
      });
    } catch (error: any) {
      console.error('Create workplace error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create workplace',
        error: error.message
      });
    }
  }
);

// Update workplace
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, color, hourlyRate, address, contactInfo, notes,
      isRecurring, recurrencePattern, recurrenceEndDate
    } = req.body;

    const checkResult = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('userId', sql.Int, req.userId)
      .query('SELECT id FROM Workplaces WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workplace not found'
      });
    }

    const updateResult = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('name', sql.NVarChar, name)
      .input('color', sql.NVarChar, color)
      .input('hourlyRate', sql.Decimal(10, 2), hourlyRate)
      .input('address', sql.NVarChar, address || null)
      .input('contactInfo', sql.NVarChar, contactInfo || null)
      .input('notes', sql.NVarChar, notes || null)
      .input('isRecurring', sql.Bit, isRecurring || false)
      .input('recurrencePattern', sql.NVarChar, recurrencePattern || null)
      .input('recurrenceEndDate', sql.DateTime, recurrenceEndDate || null)
      .query(`
        UPDATE Workplaces
        SET name = @name, color = @color, hourlyRate = @hourlyRate, address = @address, 
            contactInfo = @contactInfo, notes = @notes, isRecurring = @isRecurring, 
            recurrencePattern = @recurrencePattern, recurrenceEndDate = @recurrenceEndDate, 
            updatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Workplace updated successfully',
      data: updateResult.recordset[0]
    });
  } catch (error: any) {
    console.error('Update workplace error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workplace',
      error: error.message
    });
  }
});

// Delete workplace
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const checkResult = await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .input('userId', sql.Int, req.userId)
      .query('SELECT id FROM Workplaces WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workplace not found'
      });
    }

    await sqlPool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Workplaces WHERE id = @id');

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
  }
});

export default router;
