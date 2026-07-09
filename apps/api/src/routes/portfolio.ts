import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate } from './auth';
import { uploadFile } from '../services/storage';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max per file
});

const createPortfolioSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  technologies: z.string().optional(),
  softwareUsed: z.string().optional(),
  timeline: z.string().optional(),
  collaborators: z.string().optional(),
  visibility: z.string().default('PUBLIC'),
  discipline: z.string().optional(),
  fullCaseStudy: z.string().optional(),
  skills: z.string().optional(),
  status: z.string().optional(),
  clientType: z.string().optional(),
  teamSize: z.string().optional().transform(v => v ? parseInt(v) : 1),
  role: z.string().optional(),
  links: z.string().optional(),
  additionalInfo: z.string().optional(),
  seoInfo: z.string().optional(),
  licensing: z.string().optional(),
  credits: z.string().optional(),
  isFeatured: z.string().optional().transform(v => v === 'true'),
});

// GET /api/portfolio/trending
router.get('/trending', async (req, res) => {
  try {
    const portfolios = await prisma.portfolio.findMany({
      where: { deletedAt: null, visibility: 'PUBLIC' },
      include: {
        creator: { select: { name: true, profile: { select: { avatarUrl: true } } } }
      },
      orderBy: [ { likes: 'desc' }, { views: 'desc' } ],
      take: 10
    });
    res.json(portfolios);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/portfolio/search
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q as string || '';
    const portfolios = await prisma.portfolio.findMany({
      where: {
        deletedAt: null,
        visibility: 'PUBLIC',
        OR: [
          { title: { contains: q } },
          { tags: { contains: q } },
          { category: { contains: q } }
        ]
      },
      include: {
        creator: { select: { name: true, profile: { select: { avatarUrl: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(portfolios);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/portfolio/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.portfolio.findMany({
      where: { deletedAt: null, category: { not: null } },
      select: { category: true },
      distinct: ['category']
    });
    res.json(categories.map(c => c.category).filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/portfolio
router.get('/', async (req, res) => {
  try {
    const category = req.query.category as string;
    const portfolios = await prisma.portfolio.findMany({
      where: { 
        deletedAt: null, 
        visibility: 'PUBLIC',
        ...(category ? { category } : {})
      },
      include: {
        creator: { select: { name: true, profile: { select: { avatarUrl: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(portfolios);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/portfolio/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Increment view
    await prisma.portfolio.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true, profile: { select: { avatarUrl: true, bio: true } } } },
        mediaList: { orderBy: { order: 'asc' } },
        comments: {
          include: { user: { select: { name: true, profile: { select: { avatarUrl: true } } } } },
          orderBy: { createdAt: 'desc' }
        },
        portfolioLikes: true,
      }
    });

    if (!portfolio || portfolio.deletedAt) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/portfolio (Create)
router.post('/', authenticate, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'media', maxCount: 10 }
]), async (req: any, res) => {
  try {
    const data = createPortfolioSchema.parse(req.body);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    let coverImageUrl = null;
    if (files.coverImage && files.coverImage[0]) {
      const cover = files.coverImage[0];
      const blobName = `cover-${req.user.userId}-${Date.now()}`;
      coverImageUrl = await uploadFile('portfolios', blobName, cover.buffer, cover.mimetype);
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        ...data,
        coverImage: coverImageUrl,
        creatorId: req.user.userId,
      }
    });

    // Upload and create media records
    if (files.media && files.media.length > 0) {
      const mediaPromises = files.media.map(async (file, index) => {
        const blobName = `media-${req.user.userId}-${Date.now()}-${index}`;
        const mediaUrl = await uploadFile('portfolios', blobName, file.buffer, file.mimetype);
        
        let mediaType = 'IMAGE';
        if (file.mimetype.startsWith('video/')) mediaType = 'VIDEO';
        else if (file.mimetype.startsWith('audio/')) mediaType = 'AUDIO';
        else if (file.mimetype === 'application/pdf') mediaType = 'PDF';
        else if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') mediaType = 'ZIP';

        return prisma.portfolioMedia.create({
          data: {
            portfolioId: portfolio.id,
            url: mediaUrl,
            mediaType,
            order: index
          }
        });
      });
      await Promise.all(mediaPromises);
    }

    res.status(201).json(portfolio);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: (error as any).errors });
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/portfolio/:id (Update)
router.put('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const data = createPortfolioSchema.partial().parse(req.body);
    
    const existing = await prisma.portfolio.findUnique({ where: { id } });
    if (!existing || existing.creatorId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.portfolio.update({
      where: { id },
      data
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/portfolio/:id (Soft Delete)
router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.portfolio.findUnique({ where: { id } });
    if (!existing || existing.creatorId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.portfolio.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/portfolio/:id/like
router.post('/:id/like', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.portfolioLike.findUnique({
      where: { portfolioId_userId: { portfolioId: id, userId: req.user.userId } }
    });

    if (existing) {
      await prisma.portfolioLike.delete({ where: { id: existing.id } });
      await prisma.portfolio.update({ where: { id }, data: { likes: { decrement: 1 } } });
      return res.json({ liked: false });
    } else {
      await prisma.portfolioLike.create({
        data: { portfolioId: id, userId: req.user.userId }
      });
      await prisma.portfolio.update({ where: { id }, data: { likes: { increment: 1 } } });
      return res.json({ liked: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/portfolio/:id/bookmark
router.post('/:id/bookmark', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.portfolioBookmark.findUnique({
      where: { portfolioId_userId: { portfolioId: id, userId: req.user.userId } }
    });

    if (existing) {
      await prisma.portfolioBookmark.delete({ where: { id: existing.id } });
      await prisma.portfolio.update({ where: { id }, data: { bookmarks: { decrement: 1 } } });
      return res.json({ bookmarked: false });
    } else {
      await prisma.portfolioBookmark.create({
        data: { portfolioId: id, userId: req.user.userId }
      });
      await prisma.portfolio.update({ where: { id }, data: { bookmarks: { increment: 1 } } });
      return res.json({ bookmarked: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/portfolio/:id/comment
router.post('/:id/comment', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

    const comment = await prisma.portfolioComment.create({
      data: {
        portfolioId: id,
        userId: req.user.userId,
        content
      },
      include: {
        user: { select: { name: true, profile: { select: { avatarUrl: true } } } }
      }
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
