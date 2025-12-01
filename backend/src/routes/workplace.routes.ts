import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sqlPool } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all workplaces for logged-in user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const pool = await sqlPool;
    const result = await pool.request()
      .input('userId', req.userId)
      .query(`
        SELECT * FROM Workplaces 
        WHERE userId = @userId 
        ORDER BY createdAt DESC
      `);

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
    const pool = await sqlPool;
    const result = await pool.request()
      .input('id', req.params.id)
      .input('userId', req.userId)
      .query(`
        SELECT * FROM Workplaces 
        WHERE id = @id AND userId = @userId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workplace not found'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
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

      const { name, color, hourlyRate, address, contactInfo, notes } = req.body;
      const pool = await sqlPool;

      const result = await pool.request()
        .input('userId', req.userId)
        .input('name', name)
        .input('color', color)
        .input('hourlyRate', hourlyRate)
        .input('address', address || null)
        .input('contactInfo', contactInfo || null)
        .input('notes', notes || null)
        .query(`
          INSERT INTO Workplaces (userId, name, color, hourlyRate, address, contactInfo, notes)
          OUTPUT INSERTED.*
          VALUES (@userId, @name, @color, @hourlyRate, @address, @contactInfo, @notes)
        `);

      res.status(201).json({
        success: true,
        message: 'Workplace created successfully',
        data: result.recordset[0]
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
    const { name, color, hourlyRate, address, contactInfo, notes } = req.body;
    const pool = await sqlPool;

    const checkResult = await pool.request()
      .input('id', req.params.id)
      .input('userId', req.userId)
      .query('SELECT id FROM Workplaces WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workplace not found'
      });
    }

    const result = await pool.request()
      .input('id', req.params.id)
      .input('name', name)
      .input('color', color)
      .input('hourlyRate', hourlyRate)
      .input('address', address || null)
      .input('contactInfo', contactInfo || null)
      .input('notes', notes || null)
      .query(`
        UPDATE Workplaces 
        SET name = @name,
            color = @color,
            hourlyRate = @hourlyRate,
            address = @address,
            contactInfo = @contactInfo,
            notes = @notes,
            updatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Workplace updated successfully',
      data: result.recordset[0]
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
    const pool = await sqlPool;

    const checkResult = await pool.request()
      .input('id', req.params.id)
      .input('userId', req.userId)
      .query('SELECT id FROM Workplaces WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workplace not found'
      });
    }

    await pool.request()
      .input('id', req.params.id)
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