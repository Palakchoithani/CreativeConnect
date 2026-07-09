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

const jobSchema = z.object({
  title: z.string().min(3),
  company: z.string().min(1),
  location: z.string().optional(),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE']).default('FULL_TIME'),
  salary: z.string().optional(),
  description: z.string().min(10),
});

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        poster: { select: { name: true, profile: { select: { avatarUrl: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        poster: { select: { name: true, profile: { select: { avatarUrl: true, bio: true } } } },
        applications: {
          select: { applicantId: true, status: true }
        }
      }
    });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create job
router.post('/', authenticate, async (req: any, res: any) => {
  try {
    const data = jobSchema.parse(req.body);
    const job = await prisma.job.create({
      data: {
        ...data,
        posterId: req.user.userId
      }
    });
    res.status(201).json(job);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Apply to job
router.post('/:id/apply', authenticate, async (req: any, res: any) => {
  try {
    const jobId = req.params.id;
    const applicantId = req.user.userId;

    const existingApplication = await prisma.jobApplication.findUnique({
      where: { jobId_applicantId: { jobId, applicantId } }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied to this job' });
    }

    const latestPortfolio = await prisma.portfolio.findFirst({
      where: { creatorId: applicantId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        applicantId,
        portfolioId: latestPortfolio ? latestPortfolio.id : null
      }
    });
    res.status(201).json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my applications
router.get('/me/applications', authenticate, async (req: any, res: any) => {
  try {
    const applications = await prisma.jobApplication.findMany({
      where: { applicantId: req.user.userId },
      include: {
        job: {
          select: { title: true, company: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    // Format to match frontend expectations
    const formattedApps = applications.map(app => ({
      ...app,
      jobTitle: app.job.title,
      company: app.job.company
    }));
    res.json(formattedApps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
