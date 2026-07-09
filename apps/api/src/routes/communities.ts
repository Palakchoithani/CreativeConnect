import { Router } from 'express';
import multer from 'multer';
import prisma from '../prisma';
import { authenticate } from './auth';
import { uploadFile } from '../services/storage';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/communities
router.get('/', async (req, res) => {
  try {
    const communities = await prisma.community.findMany({
      include: {
        members: true
      }
    });
    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/communities/:id
router.get('/:id', async (req, res) => {
  try {
    const community = await prisma.community.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { name: true } },
        members: { include: { user: { select: { name: true, profile: { select: { avatarUrl: true } } } } } },
        posts: {
          include: { creator: { select: { name: true, profile: { select: { avatarUrl: true } } } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!community) return res.status(404).json({ error: 'Community not found' });
    res.json(community);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/communities
router.post('/', authenticate, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), async (req: any, res) => {
  try {
    const { name, description, rules, category } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    let logoUrl = null;
    let bannerUrl = null;

    if (files?.logo?.[0]) {
      logoUrl = await uploadFile('communities', `logo-${Date.now()}`, files.logo[0].buffer, files.logo[0].mimetype);
    }
    if (files?.banner?.[0]) {
      bannerUrl = await uploadFile('communities', `banner-${Date.now()}`, files.banner[0].buffer, files.banner[0].mimetype);
    }

    const community = await prisma.community.create({
      data: {
        name,
        description,
        rules,
        category,
        logo: logoUrl,
        banner: bannerUrl,
        creatorId: req.user.userId,
        members: {
          create: {
            userId: req.user.userId,
            role: 'OWNER'
          }
        }
      }
    });

    res.status(201).json(community);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/communities/:id/join
router.post('/:id/join', authenticate, async (req: any, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.user.userId;

    const existing = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } }
    });
    if (existing) return res.status(400).json({ error: 'Already a member' });

    const member = await prisma.communityMember.create({
      data: { communityId, userId, role: 'MEMBER' }
    });

    // Create invite/membership notification
    const community = await prisma.community.findUnique({ where: { id: communityId } });
    await prisma.notification.create({
      data: {
        userId: community?.creatorId || '',
        type: 'INVITE',
        content: `A new member joined your community ${community?.name}`,
        linkUrl: `/community/groups/${communityId}`
      }
    });

    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/communities/:id/leave
router.post('/:id/leave', authenticate, async (req: any, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.user.userId;

    const existing = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } }
    });
    if (!existing) return res.status(400).json({ error: 'Not a member' });
    if (existing.role === 'OWNER') return res.status(400).json({ error: 'Owner cannot leave community' });

    await prisma.communityMember.delete({ where: { id: existing.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/communities/:id/posts
router.post('/:id/posts', authenticate, upload.single('media'), async (req: any, res) => {
  try {
    const communityId = req.params.id;
    const { title, content } = req.body;
    
    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: req.user.userId } }
    });
    if (!membership) return res.status(403).json({ error: 'Must join community to post' });

    let mediaUrl = null;
    let mediaType = null;

    if (req.file) {
      mediaUrl = await uploadFile('communities', `post-${Date.now()}`, req.file.buffer, req.file.mimetype);
      mediaType = req.file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';
    }

    const post = await prisma.communityPost.create({
      data: {
        communityId,
        creatorId: req.user.userId,
        title,
        content,
        mediaUrl,
        mediaType
      }
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
