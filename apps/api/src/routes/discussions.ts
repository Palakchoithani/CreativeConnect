import { Router } from 'express';
import prisma from '../prisma';
import { authenticate } from './auth';

const router = Router();

// GET /api/discussions
router.get('/', async (req, res) => {
  try {
    const category = req.query.category as string;
    const discussions = await prisma.discussion.findMany({
      where: category ? { category } : {},
      include: {
        user: { select: { name: true, profile: { select: { avatarUrl: true } } } },
        replies: { select: { id: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/discussions/:id
router.get('/:id', async (req, res) => {
  try {
    const discussion = await prisma.discussion.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, profile: { select: { avatarUrl: true } } } },
        replies: {
          include: {
            user: { select: { name: true, profile: { select: { avatarUrl: true } } } },
            votes: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });
    res.json(discussion);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/discussions
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { title, content, category } = req.body;
    const discussion = await prisma.discussion.create({
      data: {
        title,
        content,
        category,
        userId: req.user.userId
      }
    });
    res.status(201).json(discussion);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/discussions/:id/replies
router.post('/:id/replies', authenticate, async (req: any, res) => {
  try {
    const discussionId = req.params.id;
    const { content } = req.body;

    const reply = await prisma.discussionReply.create({
      data: {
        discussionId,
        content,
        userId: req.user.userId
      }
    });

    // Notify discussion owner
    const discussion = await prisma.discussion.findUnique({ where: { id: discussionId } });
    if (discussion && discussion.userId !== req.user.userId) {
      await prisma.notification.create({
        data: {
          userId: discussion.userId,
          type: 'REPLY',
          content: `New answer posted on your discussion: ${discussion.title}`,
          linkUrl: `/community/discussions/${discussionId}`
        }
      });
    }

    res.status(201).json(reply);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/discussions/replies/:replyId/vote
router.post('/replies/:replyId/vote', authenticate, async (req: any, res) => {
  try {
    const { replyId } = req.params;
    const { value } = req.body; // 1 or -1
    const userId = req.user.userId;

    if (value !== 1 && value !== -1) {
      return res.status(400).json({ error: 'Invalid vote value' });
    }

    const existing = await prisma.discussionVote.findUnique({
      where: { replyId_userId: { replyId, userId } }
    });

    if (existing) {
      if (existing.value === value) {
        // Undo vote
        await prisma.discussionVote.delete({ where: { id: existing.id } });
      } else {
        // Toggle vote
        await prisma.discussionVote.update({
          where: { id: existing.id },
          data: { value }
        });
      }
    } else {
      await prisma.discussionVote.create({
        data: { replyId, userId, value }
      });
    }

    // Recalculate upvotes/downvotes
    const votes = await prisma.discussionVote.findMany({ where: { replyId } });
    const upvotes = votes.filter(v => v.value === 1).length;
    const downvotes = votes.filter(v => v.value === -1).length;

    await prisma.discussionReply.update({
      where: { id: replyId },
      data: { upvotes, downvotes }
    });

    res.json({ upvotes, downvotes });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/discussions/replies/:replyId/accept
router.post('/replies/:replyId/accept', authenticate, async (req: any, res) => {
  try {
    const { replyId } = req.params;
    const reply = await prisma.discussionReply.findUnique({
      where: { id: replyId },
      include: { discussion: true }
    });

    if (!reply) return res.status(404).json({ error: 'Reply not found' });
    if (reply.discussion.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Only thread author can accept answers' });
    }

    await prisma.discussion.update({
      where: { id: reply.discussionId },
      data: { acceptedReplyId: replyId }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
