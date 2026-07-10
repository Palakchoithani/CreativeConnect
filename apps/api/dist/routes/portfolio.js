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
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max per file
});
const createPortfolioSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    subtitle: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    tags: zod_1.z.string().optional(),
    technologies: zod_1.z.string().optional(),
    softwareUsed: zod_1.z.string().optional(),
    timeline: zod_1.z.string().optional(),
    collaborators: zod_1.z.string().optional(),
    visibility: zod_1.z.string().default('PUBLIC'),
    discipline: zod_1.z.string().optional(),
    fullCaseStudy: zod_1.z.string().optional(),
    skills: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    clientType: zod_1.z.string().optional(),
    teamSize: zod_1.z.string().optional().transform(v => v ? parseInt(v) : 1),
    role: zod_1.z.string().optional(),
    links: zod_1.z.string().optional(),
    additionalInfo: zod_1.z.string().optional(),
    seoInfo: zod_1.z.string().optional(),
    licensing: zod_1.z.string().optional(),
    credits: zod_1.z.string().optional(),
    isFeatured: zod_1.z.string().optional().transform(v => v === 'true'),
});
// GET /api/portfolio/trending
router.get('/trending', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const portfolios = yield prisma_1.default.portfolio.findMany({
            where: { deletedAt: null, visibility: 'PUBLIC' },
            include: {
                creator: { select: { name: true, profile: { select: { avatarUrl: true } } } }
            },
            orderBy: [{ likes: 'desc' }, { views: 'desc' }],
            take: 10
        });
        res.json(portfolios);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/portfolio/search
router.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const q = req.query.q || '';
        const portfolios = yield prisma_1.default.portfolio.findMany({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/portfolio/categories
router.get('/categories', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield prisma_1.default.portfolio.findMany({
            where: { deletedAt: null, category: { not: null } },
            select: { category: true },
            distinct: ['category']
        });
        res.json(categories.map(c => c.category).filter(Boolean));
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/portfolio
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = req.query.category;
        const portfolios = yield prisma_1.default.portfolio.findMany({
            where: Object.assign({ deletedAt: null, visibility: 'PUBLIC' }, (category ? { category } : {})),
            include: {
                creator: { select: { name: true, profile: { select: { avatarUrl: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(portfolios);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/portfolio/:id
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Increment view
        yield prisma_1.default.portfolio.update({
            where: { id },
            data: { views: { increment: 1 } }
        });
        const portfolio = yield prisma_1.default.portfolio.findUnique({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/portfolio (Create)
router.post('/', auth_1.authenticate, upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'media', maxCount: 10 }
]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = createPortfolioSchema.parse(req.body);
        const files = req.files;
        let coverImageUrl = null;
        if (files.coverImage && files.coverImage[0]) {
            const cover = files.coverImage[0];
            const blobName = `cover-${req.user.userId}-${Date.now()}`;
            coverImageUrl = yield (0, storage_1.uploadFile)('portfolios', blobName, cover.buffer, cover.mimetype);
        }
        const portfolio = yield prisma_1.default.portfolio.create({
            data: Object.assign(Object.assign({}, data), { coverImage: coverImageUrl, creatorId: req.user.userId })
        });
        // Upload and create media records
        if (files.media && files.media.length > 0) {
            const mediaPromises = files.media.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
                const blobName = `media-${req.user.userId}-${Date.now()}-${index}`;
                const mediaUrl = yield (0, storage_1.uploadFile)('portfolios', blobName, file.buffer, file.mimetype);
                let mediaType = 'IMAGE';
                if (file.mimetype.startsWith('video/'))
                    mediaType = 'VIDEO';
                else if (file.mimetype.startsWith('audio/'))
                    mediaType = 'AUDIO';
                else if (file.mimetype === 'application/pdf')
                    mediaType = 'PDF';
                else if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed')
                    mediaType = 'ZIP';
                return prisma_1.default.portfolioMedia.create({
                    data: {
                        portfolioId: portfolio.id,
                        url: mediaUrl,
                        mediaType,
                        order: index
                    }
                });
            }));
            yield Promise.all(mediaPromises);
        }
        res.status(201).json(portfolio);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: error.errors });
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// PUT /api/portfolio/:id (Update)
router.put('/:id', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = createPortfolioSchema.partial().parse(req.body);
        const existing = yield prisma_1.default.portfolio.findUnique({ where: { id } });
        if (!existing || existing.creatorId !== req.user.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const updated = yield prisma_1.default.portfolio.update({
            where: { id },
            data
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// DELETE /api/portfolio/:id (Soft Delete)
router.delete('/:id', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const existing = yield prisma_1.default.portfolio.findUnique({ where: { id } });
        if (!existing || existing.creatorId !== req.user.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        yield prisma_1.default.portfolio.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/portfolio/:id/like
router.post('/:id/like', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const existing = yield prisma_1.default.portfolioLike.findUnique({
            where: { portfolioId_userId: { portfolioId: id, userId: req.user.userId } }
        });
        if (existing) {
            yield prisma_1.default.portfolioLike.delete({ where: { id: existing.id } });
            yield prisma_1.default.portfolio.update({ where: { id }, data: { likes: { decrement: 1 } } });
            return res.json({ liked: false });
        }
        else {
            yield prisma_1.default.portfolioLike.create({
                data: { portfolioId: id, userId: req.user.userId }
            });
            yield prisma_1.default.portfolio.update({ where: { id }, data: { likes: { increment: 1 } } });
            return res.json({ liked: true });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/portfolio/:id/bookmark
router.post('/:id/bookmark', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const existing = yield prisma_1.default.portfolioBookmark.findUnique({
            where: { portfolioId_userId: { portfolioId: id, userId: req.user.userId } }
        });
        if (existing) {
            yield prisma_1.default.portfolioBookmark.delete({ where: { id: existing.id } });
            yield prisma_1.default.portfolio.update({ where: { id }, data: { bookmarks: { decrement: 1 } } });
            return res.json({ bookmarked: false });
        }
        else {
            yield prisma_1.default.portfolioBookmark.create({
                data: { portfolioId: id, userId: req.user.userId }
            });
            yield prisma_1.default.portfolio.update({ where: { id }, data: { bookmarks: { increment: 1 } } });
            return res.json({ bookmarked: true });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/portfolio/:id/comment
router.post('/:id/comment', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { content } = req.body;
        if (!content || !content.trim())
            return res.status(400).json({ error: 'Content is required' });
        const comment = yield prisma_1.default.portfolioComment.create({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
