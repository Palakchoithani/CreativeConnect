import { Router } from 'express';
import prisma from '../prisma';
import { authenticate } from './auth';

const router = Router();

// Follow a user / Send connection request (toggle)
router.post('/:followingId', authenticate, async (req: any, res) => {
  try {
    const followerId = req.user.userId;
    const { followingId } = req.params;

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const existing = await prisma.connection.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    });

    if (existing) {
      // Unfollow
      await prisma.connection.delete({ where: { id: existing.id } });
      return res.json({ following: false, message: 'Unfollowed' });
    }

    const connection = await prisma.connection.create({
      data: { followerId, followingId, status: 'ACCEPTED' }
    });

    res.status(201).json({ following: true, connection });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my connections / followers
router.get('/', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    
    const [following, followers] = await Promise.all([
      prisma.connection.findMany({
        where: { followerId: userId },
        include: { following: { select: { id: true, name: true, profile: { select: { avatarUrl: true, bio: true } } } } }
      }),
      prisma.connection.findMany({
        where: { followingId: userId },
        include: { follower: { select: { id: true, name: true, profile: { select: { avatarUrl: true, bio: true } } } } }
      })
    ]);

    res.json({ following, followers });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check follow status between current user and another user
router.get('/status/:targetId', authenticate, async (req: any, res) => {
  try {
    const followerId = req.user.userId;
    const { targetId } = req.params;
    const connection = await prisma.connection.findUnique({
      where: { followerId_followingId: { followerId, followingId: targetId } }
    });
    res.json({ following: !!connection });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept a connection request
router.put('/:connectionId/accept', authenticate, async (req: any, res) => {
  try {
    const connection = await prisma.connection.update({
      where: { id: req.params.connectionId },
      data: { status: 'ACCEPTED' }
    });
    res.json(connection);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
