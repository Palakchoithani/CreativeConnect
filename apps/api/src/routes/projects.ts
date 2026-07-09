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

const projectSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  repoUrl: z.string().url().optional().or(z.literal('')),
  liveUrl: z.string().url().optional().or(z.literal('')),
});

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        owner: { select: { name: true, profile: { select: { avatarUrl: true } } } },
        members: { include: { user: { select: { name: true, profile: { select: { avatarUrl: true } } } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { name: true, profile: { select: { avatarUrl: true } } } },
        members: { include: { user: { select: { id: true, name: true, profile: { select: { avatarUrl: true, bio: true } } } } } }
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create project
router.post('/', authenticate, async (req: any, res: any) => {
  try {
    const data = projectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        ...data,
        ownerId: req.user.userId,
        members: {
          create: {
            userId: req.user.userId,
            role: 'OWNER'
          }
        }
      }
    });
    res.status(201).json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join project (Request or direct add - simplified to direct join for MVP)
router.post('/:id/join', authenticate, async (req: any, res: any) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.userId;

    const existingMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this project' });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role: 'MEMBER'
      }
    });
    res.status(201).json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
