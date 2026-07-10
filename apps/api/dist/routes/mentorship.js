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
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../prisma"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_creative_connect';
// Auth middleware (simplified for this route)
const authenticate = (req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
const mentorshipRequestSchema = zod_1.z.object({
    mentorId: zod_1.z.string(),
    goals: zod_1.z.string().optional(),
});
// Get all mentors (users who have some skills and are willing to mentor - simplified to all users for now except self)
router.get('/mentors', authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mentors = yield prisma_1.default.user.findMany({
            where: {
                id: { not: req.user.userId }
            },
            include: {
                profile: true
            },
            take: 20
        });
        res.json(mentors);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get my mentorships (both as mentor and mentee)
router.get('/my', authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mentoring = yield prisma_1.default.mentorship.findMany({
            where: { mentorId: req.user.userId },
            include: {
                mentee: { select: { id: true, name: true, profile: { select: { avatarUrl: true, bio: true } } } }
            }
        });
        const mentoredBy = yield prisma_1.default.mentorship.findMany({
            where: { menteeId: req.user.userId },
            include: {
                mentor: { select: { id: true, name: true, profile: { select: { avatarUrl: true, bio: true } } } }
            }
        });
        res.json({ mentoring, mentoredBy });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Request mentorship
router.post('/request', authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mentorId, goals } = mentorshipRequestSchema.parse(req.body);
        const menteeId = req.user.userId;
        if (mentorId === menteeId) {
            return res.status(400).json({ error: 'Cannot mentor yourself' });
        }
        // Check if already requested
        const existing = yield prisma_1.default.mentorship.findFirst({
            where: { mentorId, menteeId }
        });
        if (existing) {
            return res.status(400).json({ error: 'Mentorship already requested or active' });
        }
        const mentorship = yield prisma_1.default.mentorship.create({
            data: {
                mentorId,
                menteeId,
                goals,
                status: 'PENDING'
            }
        });
        res.status(201).json(mentorship);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Update mentorship status
router.put('/:id/status', authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = zod_1.z.object({ status: zod_1.z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED']) }).parse(req.body);
        const mentorship = yield prisma_1.default.mentorship.findUnique({ where: { id: req.params.id } });
        if (!mentorship)
            return res.status(404).json({ error: 'Not found' });
        if (mentorship.mentorId !== req.user.userId && mentorship.menteeId !== req.user.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const updated = yield prisma_1.default.mentorship.update({
            where: { id: req.params.id },
            data: { status }
        });
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
