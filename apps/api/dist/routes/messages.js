"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("./auth");
const router = (0, express_1.Router)();
// GET /api/messages -> Get all conversations for logged in user
router.get('/', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const conversations = yield prisma_1.default.conversation.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/messages/start -> Start a new conversation with a specific user (or return existing)
router.post('/start', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { targetUserId } = req.body;
        const userId = req.user.userId;
        if (!targetUserId)
            return res.status(400).json({ error: 'Target user ID is required' });
        // Find if a conversation already exists between these exactly two users
        const existingConvos = yield prisma_1.default.conversation.findMany({
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
        const newConversation = yield prisma_1.default.conversation.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/messages/:conversationId -> Get messages in a conversation
router.get('/:conversationId', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { conversationId } = req.params;
        const userId = req.user.userId;
        // Verify participation
        const participant = yield prisma_1.default.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId
                }
            }
        });
        if (!participant)
            return res.status(403).json({ error: 'Forbidden' });
        const messages = yield prisma_1.default.message.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/messages/:conversationId -> Send a message
router.post('/:conversationId', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { conversationId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;
        if (!content)
            return res.status(400).json({ error: 'Content is required' });
        // Verify participation
        const participant = yield prisma_1.default.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId
                }
            }
        });
        if (!participant)
            return res.status(403).json({ error: 'Forbidden' });
        const message = yield prisma_1.default.message.create({
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
        yield prisma_1.default.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });
        res.status(201).json(message);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
