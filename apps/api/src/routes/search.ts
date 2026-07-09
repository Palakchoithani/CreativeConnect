import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/search?q=query
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q as string || '').trim();

    if (!q) {
      return res.json({
        users: [],
        portfolios: [],
        jobs: [],
        projects: []
      });
    }

    const [users, portfolios, jobs, projects] = await Promise.all([
      // Search Users (Creatives)
      prisma.user.findMany({
        where: {
          role: 'CREATIVE',
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            {
              profile: {
                OR: [
                  { bio: { contains: q } },
                  { location: { contains: q } },
                  { skills: { contains: q } }
                ]
              }
            }
          ]
        },
        include: {
          profile: {
            select: {
              avatarUrl: true,
              bio: true,
              location: true,
              skills: true
            }
          }
        },
        take: 20
      }),

      // Search Portfolios
      prisma.portfolio.findMany({
        where: {
          deletedAt: null,
          visibility: 'PUBLIC',
          OR: [
            { title: { contains: q } },
            { subtitle: { contains: q } },
            { description: { contains: q } },
            { category: { contains: q } },
            { tags: { contains: q } }
          ]
        },
        include: {
          creator: {
            select: {
              name: true,
              profile: {
                select: {
                  avatarUrl: true
                }
              }
            }
          }
        },
        take: 20
      }),

      // Search Jobs
      prisma.job.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { company: { contains: q } },
            { description: { contains: q } },
            { location: { contains: q } }
          ]
        },
        take: 20
      }),

      // Search Collaborations
      prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } }
          ]
        },
        include: {
          owner: {
            select: {
              name: true,
              profile: {
                select: {
                  avatarUrl: true
                }
              }
            }
          }
        },
        take: 20
      })
    ]);

    res.json({
      users,
      portfolios,
      jobs,
      projects
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
