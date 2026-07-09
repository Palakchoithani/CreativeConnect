import { Router } from 'express';
import prisma from '../prisma';
import { authenticate } from './auth';

const router = Router();

// GET /api/portfolio-reviews/:portfolioId
router.get('/:portfolioId', async (req, res) => {
  try {
    const reviews = await prisma.portfolioReview.findMany({
      where: { portfolioId: req.params.portfolioId },
      include: {
        reviewer: { select: { name: true, profile: { select: { avatarUrl: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/portfolio-reviews/:portfolioId
router.post('/:portfolioId', authenticate, async (req: any, res) => {
  try {
    const { portfolioId } = req.params;
    const { rating, content } = req.body;

    const review = await prisma.portfolioReview.create({
      data: {
        portfolioId,
        reviewerId: req.user.userId,
        rating: parseInt(rating, 10),
        content
      }
    });

    // Notify portfolio owner
    const portfolio = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
    if (portfolio && portfolio.creatorId !== req.user.userId) {
      await prisma.notification.create({
        data: {
          userId: portfolio.creatorId,
          type: 'COMMENT',
          content: `New portfolio review left on project ${portfolio.title}`,
          linkUrl: `/portfolio/${portfolioId}`
        }
      });
    }

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/portfolio-reviews/:reviewId/helpful
router.post('/:reviewId/helpful', authenticate, async (req: any, res) => {
  try {
    const { reviewId } = req.params;
    const review = await prisma.portfolioReview.update({
      where: { id: reviewId },
      data: { helpfulVotes: { increment: 1 } }
    });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
