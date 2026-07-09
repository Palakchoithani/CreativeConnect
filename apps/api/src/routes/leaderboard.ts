import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/leaderboard
router.get('/', async (req, res) => {
  try {
    const [creatives, projects, portfolios] = await Promise.all([
      // Top creatives (based on profile metrics)
      prisma.user.findMany({
        where: { role: 'CREATIVE' },
        include: {
          profile: { select: { avatarUrl: true, bio: true } },
          portfolios: true
        },
        take: 10
      }),

      // Top collaborative projects
      prisma.project.findMany({
        include: { members: true },
        take: 5
      }),

      // Top liked portfolios
      prisma.portfolio.findMany({
        where: { deletedAt: null, visibility: 'PUBLIC' },
        include: { creator: { select: { name: true } } },
        orderBy: { likes: 'desc' },
        take: 5
      })
    ]);

    // Format creative rankings
    const rankings = creatives.map(u => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.profile?.avatarUrl,
      projectsCount: u.portfolios.length,
      likesCount: u.portfolios.reduce((acc, curr) => acc + curr.likes, 0)
    })).sort((a, b) => b.likesCount - a.likesCount);

    res.json({
      creatives: rankings,
      projects,
      portfolios
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
