import { Router } from 'express';
import multer from 'multer';
import prisma from '../prisma';
import { authenticate } from './auth';
import { uploadFile } from '../services/storage';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/challenges
router.get('/', async (req, res) => {
  try {
    const challenges = await prisma.challenge.findMany({
      include: { entries: true },
      orderBy: { deadline: 'asc' }
    });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/challenges/:id
router.get('/:id', async (req, res) => {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: req.params.id },
      include: {
        entries: {
          include: { user: { select: { name: true, profile: { select: { avatarUrl: true } } } } },
          orderBy: { votes: 'desc' }
        }
      }
    });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/challenges
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { theme, description, deadline, rules, rewards, judges, badgeName } = req.body;
    const challenge = await prisma.challenge.create({
      data: {
        theme,
        description,
        deadline: new Date(deadline),
        rules,
        rewards,
        judges,
        badgeName
      }
    });
    res.status(201).json(challenge);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/challenges/:id/entries
router.post('/:id/entries', authenticate, upload.single('media'), async (req: any, res) => {
  try {
    const challengeId = req.params.id;
    const { title, description } = req.body;

    let mediaUrl = null;
    if (req.file) {
      mediaUrl = await uploadFile('challenges', `entry-${Date.now()}`, req.file.buffer, req.file.mimetype);
    }

    const entry = await prisma.challengeEntry.create({
      data: {
        challengeId,
        userId: req.user.userId,
        title,
        description,
        mediaUrl
      }
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/challenges/entries/:entryId/vote
router.post('/entries/:entryId/vote', authenticate, async (req: any, res) => {
  try {
    const { entryId } = req.params;
    
    // Quick increment
    const entry = await prisma.challengeEntry.update({
      where: { id: entryId },
      data: { votes: { increment: 1 } }
    });

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
