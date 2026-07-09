import { Router } from 'express';
import prisma from '../prisma';
import { authenticate } from './auth';

const router = Router();

// Middleware to authorize Admins only
const authorizeAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  next();
};

// GET /api/admin/overview
router.get('/overview', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const [totalUsers, activeUsers, suspendedUsers, recruiters, mentors, jobsPosted, applications, communities, reports] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { role: 'RECRUITER' } }),
      prisma.user.count({ where: { role: 'MENTOR' } }),
      prisma.job.count(),
      prisma.jobApplication.count(),
      prisma.community.count(),
      prisma.report.count({ where: { status: 'PENDING' } })
    ]);

    res.json({
      totalUsers,
      activeUsers,
      suspendedUsers,
      recruiters,
      mentors,
      jobsPosted,
      applications,
      communities,
      reports
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users
router.get('/users', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users/:id/suspend
router.post('/users/:id/suspend', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users/:id/verify
router.post('/users/:id/verify', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: !user.isVerified }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users/:id/role
router.post('/users/:id/role', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['ADMIN', 'CREATIVE', 'RECRUITER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/jobs/:id
router.delete('/jobs/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    await prisma.job.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    await prisma.post.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/communities/:id
router.delete('/communities/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    await prisma.community.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/reports
router.get('/reports', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: { reporter: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/reports/:id/resolve
router.post('/reports/:id/resolve', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const updated = await prisma.report.update({
      where: { id: req.params.id },
      data: { status: 'RESOLVED' }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
