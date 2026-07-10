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
const updateProfileSchema = zod_1.z.object({
    bio: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    skills: zod_1.z.string().optional(),
    website: zod_1.z.string().optional(),
    instagram: zod_1.z.string().optional(),
    twitter: zod_1.z.string().optional(),
    linkedin: zod_1.z.string().optional(),
});
// Get current user's profile
router.get('/me', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profile = yield prisma_1.default.profile.findUnique({
            where: { userId: req.user.userId },
            include: { user: { select: { name: true, email: true, role: true } } }
        });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(profile);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Update profile info
router.put('/me', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = updateProfileSchema.parse(req.body);
        const profile = yield prisma_1.default.profile.update({
            where: { userId: req.user.userId },
            data,
        });
        res.json(profile);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Upload profile avatar — supports both /me/avatar and /avatar (alias)
router.post('/me/avatar', auth_1.authenticate, upload.single('avatar'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: 'Only image files are allowed' });
        }
        if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'Image must be smaller than 5MB' });
        }
        const blobName = `avatar-${req.user.userId}-${Date.now()}`;
        const avatarUrl = yield (0, storage_1.uploadFile)('profiles', blobName, req.file.buffer, req.file.mimetype);
        const profile = yield prisma_1.default.profile.update({
            where: { userId: req.user.userId },
            data: { avatarUrl },
        });
        res.json(profile);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Alias: /api/profile/avatar -> /api/profile/me/avatar
router.post('/avatar', auth_1.authenticate, upload.single('avatar'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: 'Only image files are allowed' });
        }
        if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'Image must be smaller than 5MB' });
        }
        const blobName = `avatar-${req.user.userId}-${Date.now()}`;
        const avatarUrl = yield (0, storage_1.uploadFile)('profiles', blobName, req.file.buffer, req.file.mimetype);
        const profile = yield prisma_1.default.profile.update({
            where: { userId: req.user.userId },
            data: { avatarUrl },
        });
        res.json(profile);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/profile/:userId — Public profile
router.get('/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const profile = yield prisma_1.default.profile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        _count: { select: { followers: true, following: true, portfolios: true } }
                    }
                }
            }
        });
        if (!profile)
            return res.status(404).json({ error: 'Profile not found' });
        res.json(profile);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
