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
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("./auth");
const storage_1 = require("../services/storage");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// GET /api/communities
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const communities = yield prisma_1.default.community.findMany({
            include: {
                members: true
            }
        });
        res.json(communities);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/communities/:id
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const community = yield prisma_1.default.community.findUnique({
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
        if (!community)
            return res.status(404).json({ error: 'Community not found' });
        res.json(community);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/communities
router.post('/', auth_1.authenticate, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { name, description, rules, category } = req.body;
        const files = req.files;
        let logoUrl = null;
        let bannerUrl = null;
        if ((_a = files === null || files === void 0 ? void 0 : files.logo) === null || _a === void 0 ? void 0 : _a[0]) {
            logoUrl = yield (0, storage_1.uploadFile)('communities', `logo-${Date.now()}`, files.logo[0].buffer, files.logo[0].mimetype);
        }
        if ((_b = files === null || files === void 0 ? void 0 : files.banner) === null || _b === void 0 ? void 0 : _b[0]) {
            bannerUrl = yield (0, storage_1.uploadFile)('communities', `banner-${Date.now()}`, files.banner[0].buffer, files.banner[0].mimetype);
        }
        const community = yield prisma_1.default.community.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/communities/:id/join
router.post('/:id/join', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const communityId = req.params.id;
        const userId = req.user.userId;
        const existing = yield prisma_1.default.communityMember.findUnique({
            where: { communityId_userId: { communityId, userId } }
        });
        if (existing)
            return res.status(400).json({ error: 'Already a member' });
        const member = yield prisma_1.default.communityMember.create({
            data: { communityId, userId, role: 'MEMBER' }
        });
        // Create invite/membership notification
        const community = yield prisma_1.default.community.findUnique({ where: { id: communityId } });
        yield prisma_1.default.notification.create({
            data: {
                userId: (community === null || community === void 0 ? void 0 : community.creatorId) || '',
                type: 'INVITE',
                content: `A new member joined your community ${community === null || community === void 0 ? void 0 : community.name}`,
                linkUrl: `/community/groups/${communityId}`
            }
        });
        res.status(201).json(member);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/communities/:id/leave
router.post('/:id/leave', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const communityId = req.params.id;
        const userId = req.user.userId;
        const existing = yield prisma_1.default.communityMember.findUnique({
            where: { communityId_userId: { communityId, userId } }
        });
        if (!existing)
            return res.status(400).json({ error: 'Not a member' });
        if (existing.role === 'OWNER')
            return res.status(400).json({ error: 'Owner cannot leave community' });
        yield prisma_1.default.communityMember.delete({ where: { id: existing.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/communities/:id/posts
router.post('/:id/posts', auth_1.authenticate, upload.single('media'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const communityId = req.params.id;
        const { title, content } = req.body;
        const membership = yield prisma_1.default.communityMember.findUnique({
            where: { communityId_userId: { communityId, userId: req.user.userId } }
        });
        if (!membership)
            return res.status(403).json({ error: 'Must join community to post' });
        let mediaUrl = null;
        let mediaType = null;
        if (req.file) {
            mediaUrl = yield (0, storage_1.uploadFile)('communities', `post-${Date.now()}`, req.file.buffer, req.file.mimetype);
            mediaType = req.file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';
        }
        const post = yield prisma_1.default.communityPost.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
