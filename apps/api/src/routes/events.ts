import { Router } from 'express';
import prisma from '../prisma';
import { authenticate } from './auth';

const router = Router();

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        host: { select: { name: true, profile: { select: { avatarUrl: true } } } },
        registrations: true
      },
      orderBy: { date: 'asc' }
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        host: { select: { name: true, profile: { select: { avatarUrl: true } } } },
        registrations: { include: { user: { select: { name: true, profile: { select: { avatarUrl: true } } } } } }
      }
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/events
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { title, description, speaker, date, venue, liveLink, capacity } = req.body;
    const event = await prisma.event.create({
      data: {
        title,
        description,
        speaker,
        date: new Date(date),
        venue,
        liveLink,
        capacity: parseInt(capacity, 10),
        hostId: req.user.userId
      }
    });
    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/events/:id/register
router.post('/:id/register', authenticate, async (req: any, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.userId;

    const existing = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } }
    });
    if (existing) return res.status(400).json({ error: 'Already registered' });

    const registration = await prisma.eventRegistration.create({
      data: { eventId, userId, status: 'REGISTERED' }
    });

    res.status(201).json(registration);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/events/:id/cancel
router.post('/:id/cancel', authenticate, async (req: any, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.userId;

    const existing = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } }
    });
    if (!existing) return res.status(400).json({ error: 'Not registered' });

    await prisma.eventRegistration.delete({ where: { id: existing.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
