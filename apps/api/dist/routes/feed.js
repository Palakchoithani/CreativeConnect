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
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("./auth");
const storage_1 = require("../services/storage");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const createPostSchema = zod_1.z.object({
    content: zod_1.z.string().min(1),
    mediaType: zod_1.z.string().optional(),
});
// Get personalized feed (falls back to global if no follows)
router.get('/', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        // Get users I follow
        const following = yield prisma_1.default.connection.findMany({
            where: { followerId: userId, status: 'ACCEPTED' },
            select: { followingId: true }
        });
        const followingIds = following.map(f => f.followingId);
        followingIds.push(userId);
        // If user follows nobody (besides themselves), show global feed
        const where = following.length === 0
            ? {} // global
            : { userId: { in: followingIds } };
        const [posts, total] = yield Promise.all([
            prisma_1.default.post.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
                    likes: true,
                    comments: {
                        include: { user: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } } },
                        orderBy: { createdAt: 'asc' },
                        take: 5
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma_1.default.post.count({ where })
        ]);
        res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Create a new post
router.post('/', auth_1.authenticate, upload.single('media'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = createPostSchema.parse(req.body);
        let mediaUrl = null;
        if (req.file) {
            const blobName = `post-${req.user.userId}-${Date.now()}`;
            mediaUrl = yield (0, storage_1.uploadFile)('posts', blobName, req.file.buffer, req.file.mimetype);
        }
        const post = yield prisma_1.default.post.create({
            data: Object.assign(Object.assign({}, data), { mediaUrl, userId: req.user.userId }),
            include: {
                user: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } }
            }
        });
        res.status(201).json(post);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Like / Unlike a post
router.post('/:postId/like', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const { postId } = req.params;
        const existingLike = yield prisma_1.default.like.findUnique({
            where: { postId_userId: { postId, userId } }
        });
        if (existingLike) {
            yield prisma_1.default.like.delete({ where: { id: existingLike.id } });
            return res.json({ message: 'Unliked' });
        }
        const like = yield prisma_1.default.like.create({
            data: { postId, userId }
        });
        res.json(like);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Post a comment on a post
router.post('/:postId/comment', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        if (!(content === null || content === void 0 ? void 0 : content.trim()))
            return res.status(400).json({ error: 'Content is required' });
        const comment = yield prisma_1.default.comment.create({
            data: { postId, userId: req.user.userId, content },
            include: {
                user: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } }
            }
        });
        res.status(201).json(comment);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Delete a post (owner only)
router.delete('/:postId', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const post = yield prisma_1.default.post.findUnique({ where: { id: postId } });
        if (!post)
            return res.status(404).json({ error: 'Post not found' });
        if (post.userId !== req.user.userId)
            return res.status(403).json({ error: 'Forbidden' });
        yield prisma_1.default.post.delete({ where: { id: postId } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
