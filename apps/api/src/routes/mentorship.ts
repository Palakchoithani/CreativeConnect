import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_creative_connect';

// Auth middleware (simplified for this route)
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const mentorshipRequestSchema = z.object({
  mentorId: z.string(),
  goals: z.string().optional(),
});

// Get all mentors (users who have some skills and are willing to mentor - simplified to all users for now except self)
router.get('/mentors', authenticate, async (req: any, res: any) => {
  try {
    const mentors = await prisma.user.findMany({
      where: {
        id: { not: req.user.userId }
      },
      include: {
        profile: true
      },
      take: 20
    });
    res.json(mentors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my mentorships (both as mentor and mentee)
router.get('/my', authenticate, async (req: any, res: any) => {
  try {
    const mentoring = await prisma.mentorship.findMany({
      where: { mentorId: req.user.userId },
      include: {
        mentee: { select: { id: true, name: true, profile: { select: { avatarUrl: true, bio: true } } } }
      }
    });

    const mentoredBy = await prisma.mentorship.findMany({
      where: { menteeId: req.user.userId },
      include: {
        mentor: { select: { id: true, name: true, profile: { select: { avatarUrl: true, bio: true } } } }
      }
    });

    res.json({ mentoring, mentoredBy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request mentorship
router.post('/request', authenticate, async (req: any, res: any) => {
  try {
    const { mentorId, goals } = mentorshipRequestSchema.parse(req.body);
    const menteeId = req.user.userId;

    if (mentorId === menteeId) {
      return res.status(400).json({ error: 'Cannot mentor yourself' });
    }

    // Check if already requested
    const existing = await prisma.mentorship.findFirst({
      where: { mentorId, menteeId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Mentorship already requested or active' });
    }

    const mentorship = await prisma.mentorship.create({
      data: {
        mentorId,
        menteeId,
        goals,
        status: 'PENDING'
      }
    });
    res.status(201).json(mentorship);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update mentorship status
router.put('/:id/status', authenticate, async (req: any, res: any) => {
  try {
    const { status } = z.object({ status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED']) }).parse(req.body);
    const mentorship = await prisma.mentorship.findUnique({ where: { id: req.params.id } });
    
    if (!mentorship) return res.status(404).json({ error: 'Not found' });
    if (mentorship.mentorId !== req.user.userId && mentorship.menteeId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.mentorship.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
