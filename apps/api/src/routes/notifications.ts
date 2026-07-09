import { Router } from 'express';
import prisma from '../prisma';
import { authenticate } from './auth';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, async (req: any, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', authenticate, async (req: any, res) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.userId },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
