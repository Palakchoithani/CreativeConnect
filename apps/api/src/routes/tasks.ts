import { Router } from 'express';
import prisma from '../prisma';
import { authenticate } from './auth';

const router = Router();

// GET /api/tasks/project/:projectId
router.get('/project/:projectId', authenticate, async (req: any, res) => {
  try {
    const { projectId } = req.params;
    
    // Validate project member
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.userId } }
    });
    if (!member) return res.status(403).json({ error: 'Not a member of this project' });

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: { assignee: { select: { name: true, profile: { select: { avatarUrl: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks/project/:projectId
router.post('/project/:projectId', authenticate, async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assigneeId, dueDate } = req.body;

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.userId } }
    });
    if (!member) return res.status(403).json({ error: 'Not a member of this project' });

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        assigneeId,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks/:taskId/status
router.post('/:taskId/status', authenticate, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body; // TODO, IN_PROGRESS, DONE

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status }
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
