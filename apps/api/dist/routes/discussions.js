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
// GET /api/discussions
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = req.query.category;
        const discussions = yield prisma_1.default.discussion.findMany({
            where: category ? { category } : {},
            include: {
                user: { select: { name: true, profile: { select: { avatarUrl: true } } } },
                replies: { select: { id: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(discussions);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/discussions/:id
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const discussion = yield prisma_1.default.discussion.findUnique({
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
        if (!discussion)
            return res.status(404).json({ error: 'Discussion not found' });
        res.json(discussion);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/discussions
router.post('/', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, content, category } = req.body;
        const discussion = yield prisma_1.default.discussion.create({
            data: {
                title,
                content,
                category,
                userId: req.user.userId
            }
        });
        res.status(201).json(discussion);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/discussions/:id/replies
router.post('/:id/replies', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const discussionId = req.params.id;
        const { content } = req.body;
        const reply = yield prisma_1.default.discussionReply.create({
            data: {
                discussionId,
                content,
                userId: req.user.userId
            }
        });
        // Notify discussion owner
        const discussion = yield prisma_1.default.discussion.findUnique({ where: { id: discussionId } });
        if (discussion && discussion.userId !== req.user.userId) {
            yield prisma_1.default.notification.create({
                data: {
                    userId: discussion.userId,
                    type: 'REPLY',
                    content: `New answer posted on your discussion: ${discussion.title}`,
                    linkUrl: `/community/discussions/${discussionId}`
                }
            });
        }
        res.status(201).json(reply);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/discussions/replies/:replyId/vote
router.post('/replies/:replyId/vote', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { replyId } = req.params;
        const { value } = req.body; // 1 or -1
        const userId = req.user.userId;
        if (value !== 1 && value !== -1) {
            return res.status(400).json({ error: 'Invalid vote value' });
        }
        const existing = yield prisma_1.default.discussionVote.findUnique({
            where: { replyId_userId: { replyId, userId } }
        });
        if (existing) {
            if (existing.value === value) {
                // Undo vote
                yield prisma_1.default.discussionVote.delete({ where: { id: existing.id } });
            }
            else {
                // Toggle vote
                yield prisma_1.default.discussionVote.update({
                    where: { id: existing.id },
                    data: { value }
                });
            }
        }
        else {
            yield prisma_1.default.discussionVote.create({
                data: { replyId, userId, value }
            });
        }
        // Recalculate upvotes/downvotes
        const votes = yield prisma_1.default.discussionVote.findMany({ where: { replyId } });
        const upvotes = votes.filter(v => v.value === 1).length;
        const downvotes = votes.filter(v => v.value === -1).length;
        yield prisma_1.default.discussionReply.update({
            where: { id: replyId },
            data: { upvotes, downvotes }
        });
        res.json({ upvotes, downvotes });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/discussions/replies/:replyId/accept
router.post('/replies/:replyId/accept', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { replyId } = req.params;
        const reply = yield prisma_1.default.discussionReply.findUnique({
            where: { id: replyId },
            include: { discussion: true }
        });
        if (!reply)
            return res.status(404).json({ error: 'Reply not found' });
        if (reply.discussion.userId !== req.user.userId) {
            return res.status(403).json({ error: 'Only thread author can accept answers' });
        }
        yield prisma_1.default.discussion.update({
            where: { id: reply.discussionId },
            data: { acceptedReplyId: replyId }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
