import { Router } from 'express';
import prisma from '../prisma';
import { authenticate } from './auth';

const router = Router();

// Middleware to authorize Recruiters only
const authorizeRecruiter = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'RECRUITER') {
    return res.status(403).json({ error: 'Forbidden: Recruiters only' });
  }
  next();
};

// GET /api/recruiter/company
router.get('/company', authenticate, authorizeRecruiter, async (req: any, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { recruiterId: req.user.userId }
    });
    res.json(company || null);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/recruiter/company
router.post('/company', authenticate, authorizeRecruiter, async (req: any, res) => {
  try {
    const { name, description, website, logo, banner } = req.body;

    const company = await prisma.company.upsert({
      where: { recruiterId: req.user.userId },
      update: { name, description, website, logo, banner },
      create: { recruiterId: req.user.userId, name, description, website, logo, banner }
    });

    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/recruiter/jobs
router.get('/jobs', authenticate, authorizeRecruiter, async (req: any, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { posterId: req.user.userId },
      include: {
        applications: {
          include: {
            applicant: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: { select: { bio: true, avatarUrl: true } }
              }
            },
            portfolio: {
              select: {
                id: true,
                title: true,
                coverImage: true,
                discipline: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/recruiter/applications/:appId/status
router.post('/applications/:appId/status', authenticate, authorizeRecruiter, async (req: any, res) => {
  try {
    const { status } = req.body; // SHORTLISTED, REJECTED, etc.
    const { appId } = req.params;

    const application = await prisma.jobApplication.update({
      where: { id: appId },
      data: { status },
      include: { job: true }
    });

    // Send status alert notification to candidate
    await prisma.notification.create({
      data: {
        userId: application.applicantId,
        type: 'REQUEST',
        content: `Your application for ${application.job.title} has been marked: ${status}`,
        linkUrl: '/jobs'
      }
    });

    res.json(application);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/recruiter/interviews
router.post('/interviews', authenticate, authorizeRecruiter, async (req: any, res) => {
  try {
    const { jobId, candidateId, date, linkUrl, notes } = req.body;

    const interview = await prisma.interview.create({
      data: {
        jobId,
        recruiterId: req.user.userId,
        candidateId,
        date: new Date(date),
        linkUrl,
        notes
      },
      include: { job: true }
    });

    // Notify candidate
    await prisma.notification.create({
      data: {
        userId: candidateId,
        type: 'REMINDER',
        content: `You have an interview scheduled for ${interview.job.title} on ${new Date(date).toLocaleDateString()}`,
        linkUrl: '/dashboard'
      }
    });

    res.json(interview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
