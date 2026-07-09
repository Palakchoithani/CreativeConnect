import { Router } from 'express';
import prisma from '../prisma';
import { authenticate } from './auth';

const router = Router();

// GET /api/messages -> Get all conversations for logged in user
router.get('/', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: {
                  select: {
                    avatarUrl: true
                  }
                }
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/messages/start -> Start a new conversation with a specific user (or return existing)
router.post('/start', authenticate, async (req: any, res: any) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user.userId;

    if (!targetUserId) return res.status(400).json({ error: 'Target user ID is required' });

    // Find if a conversation already exists between these exactly two users
    const existingConvos = await prisma.conversation.findMany({
      where: {
        AND: [
          { participants: { some: { userId: userId } } },
          { participants: { some: { userId: targetUserId } } }
        ]
      },
      include: { participants: true }
    });

    // Check for exact match of 2 participants
    const exactMatch = existingConvos.find(c => c.participants.length === 2);

    if (exactMatch) {
      return res.json(exactMatch);
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: userId },
            { userId: targetUserId }
          ]
        }
      },
      include: {
        participants: true
      }
    });

    res.status(201).json(newConversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/messages/:conversationId -> Get messages in a conversation
router.get('/:conversationId', authenticate, async (req: any, res: any) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    // Verify participation
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      }
    });

    if (!participant) return res.status(403).json({ error: 'Forbidden' });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatarUrl: true } }
          }
        }
      }
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/messages/:conversationId -> Send a message
router.post('/:conversationId', authenticate, async (req: any, res: any) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content) return res.status(400).json({ error: 'Content is required' });

    // Verify participation
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      }
    });

    if (!participant) return res.status(403).json({ error: 'Forbidden' });

    const message = await prisma.message.create({
      data: {
        content,
        senderId: userId,
        conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatarUrl: true } }
          }
        }
      }
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
