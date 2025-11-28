import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import { PageView } from '../models/Analytics';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();

// Increment page view
router.post(
  '/pageview',
  [body('path').isString().trim().notEmpty().withMessage('path is required')],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { path } = req.body;
      const pageView = await PageView.findOneAndUpdate(
        { path },
        { $inc: { count: 1 }, $set: { lastVisited: new Date() } },
        { new: true, upsert: true }
      );
      res.json({ success: true, data: pageView });
    } catch (error) {
      console.error('Analytics pageview error', error);
      res.status(500).json({ success: false, message: 'Failed to record page view' });
    }
  }
);

// Get top visited pages
router.get(
  '/top',
  [query('limit').optional().isInt({ min: 1, max: 50 }).toInt()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const limit = (req.query.limit as number | undefined) || 10;
      const pages = await PageView.find().sort({ count: -1 }).limit(limit).lean();
      res.json({ success: true, data: pages });
    } catch (error) {
      console.error('Analytics top error', error);
      res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
  }
);

export default router;
