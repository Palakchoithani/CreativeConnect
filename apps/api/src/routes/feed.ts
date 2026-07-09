import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate } from './auth';
import { uploadFile } from '../services/storage';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const createPostSchema = z.object({
  content: z.string().min(1),
  mediaType: z.string().optional(),
});

// Get personalized feed (falls back to global if no follows)
router.get('/', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Get users I follow
    const following = await prisma.connection.findMany({
      where: { followerId: userId, status: 'ACCEPTED' },
      select: { followingId: true }
    });

    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId);

    // If user follows nobody (besides themselves), show global feed
    const where = following.length === 0 
      ? {} // global
      : { userId: { in: followingIds } };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
          likes: true,
          comments: {
            include: { user: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } } },
            orderBy: { createdAt: 'asc' },
            take: 5
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.post.count({ where })
    ]);

    res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new post
router.post('/', authenticate, upload.single('media'), async (req: any, res) => {
  try {
    const data = createPostSchema.parse(req.body);
    let mediaUrl = null;

    if (req.file) {
      const blobName = `post-${req.user.userId}-${Date.now()}`;
      mediaUrl = await uploadFile('posts', blobName, req.file.buffer, req.file.mimetype);
    }

    const post = await prisma.post.create({
      data: {
        ...data,
        mediaUrl,
        userId: req.user.userId,
      },
      include: {
        user: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } }
      }
    });

    res.status(201).json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like / Unlike a post
router.post('/:postId/like', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;

    const existingLike = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId } }
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      return res.json({ message: 'Unliked' });
    }

    const like = await prisma.like.create({
      data: { postId, userId }
    });
    res.json(like);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Post a comment on a post
router.post('/:postId/comment', authenticate, async (req: any, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const comment = await prisma.comment.create({
      data: { postId, userId: req.user.userId, content },
      include: {
        user: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } }
      }
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a post (owner only)
router.delete('/:postId', authenticate, async (req: any, res) => {
  try {
    const { postId } = req.params;
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });
    await prisma.post.delete({ where: { id: postId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
