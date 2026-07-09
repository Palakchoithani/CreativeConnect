import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate } from './auth';
import { uploadFile } from '../services/storage';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const updateProfileSchema = z.object({
  bio: z.string().optional(),
  location: z.string().optional(),
  skills: z.string().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
});

// Get current user's profile
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
      include: { user: { select: { name: true, email: true, role: true } } }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile info
router.put('/me', authenticate, async (req: any, res) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    const profile = await prisma.profile.update({
      where: { userId: req.user.userId },
      data,
    });

    res.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload profile avatar — supports both /me/avatar and /avatar (alias)
router.post('/me/avatar', authenticate, upload.single('avatar'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image must be smaller than 5MB' });
    }

    const blobName = `avatar-${req.user.userId}-${Date.now()}`;
    const avatarUrl = await uploadFile('profiles', blobName, req.file.buffer, req.file.mimetype);

    const profile = await prisma.profile.update({
      where: { userId: req.user.userId },
      data: { avatarUrl },
    });

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Alias: /api/profile/avatar -> /api/profile/me/avatar
router.post('/avatar', authenticate, upload.single('avatar'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image must be smaller than 5MB' });
    }

    const blobName = `avatar-${req.user.userId}-${Date.now()}`;
    const avatarUrl = await uploadFile('profiles', blobName, req.file.buffer, req.file.mimetype);

    const profile = await prisma.profile.update({
      where: { userId: req.user.userId },
      data: { avatarUrl },
    });

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/profile/:userId — Public profile
router.get('/:userId', async (req: any, res) => {
  try {
    const { userId } = req.params;
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            _count: { select: { followers: true, following: true, portfolios: true } }
          }
        }
      }
    });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
