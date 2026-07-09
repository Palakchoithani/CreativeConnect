import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/users/:id/portfolio — Get a user's public portfolios
router.get('/:id/portfolio', async (req, res) => {
  try {
    const { id } = req.params;
    const portfolios = await prisma.portfolio.findMany({
      where: { creatorId: id, deletedAt: null, visibility: 'PUBLIC' },
      include: {
        creator: { select: { name: true, profile: { select: { avatarUrl: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(portfolios);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id — Get public user info
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        profile: true,
        _count: { select: { followers: true, following: true, portfolios: true } }
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
