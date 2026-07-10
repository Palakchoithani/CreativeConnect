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
// Middleware to authorize Admins only
const authorizeAdmin = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    next();
};
// GET /api/admin/overview
router.get('/overview', auth_1.authenticate, authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [totalUsers, activeUsers, suspendedUsers, recruiters, mentors, jobsPosted, applications, communities, reports] = yield Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.user.count({ where: { isActive: true } }),
            prisma_1.default.user.count({ where: { isActive: false } }),
            prisma_1.default.user.count({ where: { role: 'RECRUITER' } }),
            prisma_1.default.user.count({ where: { role: 'MENTOR' } }),
            prisma_1.default.job.count(),
            prisma_1.default.jobApplication.count(),
            prisma_1.default.community.count(),
            prisma_1.default.report.count({ where: { status: 'PENDING' } })
        ]);
        res.json({
            totalUsers,
            activeUsers,
            suspendedUsers,
            recruiters,
            mentors,
            jobsPosted,
            applications,
            communities,
            reports
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/admin/users
router.get('/users', auth_1.authenticate, authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.default.user.findMany({
            include: { profile: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/admin/users/:id/suspend
router.post('/users/:id/suspend', auth_1.authenticate, authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { id: req.params.id } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const updated = yield prisma_1.default.user.update({
            where: { id: req.params.id },
            data: { isActive: !user.isActive }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/admin/users/:id/verify
router.post('/users/:id/verify', auth_1.authenticate, authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { id: req.params.id } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const updated = yield prisma_1.default.user.update({
            where: { id: req.params.id },
            data: { isVerified: !user.isVerified }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/admin/users/:id/role
router.post('/users/:id/role', auth_1.authenticate, authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role } = req.body;
        if (!role || !['ADMIN', 'CREATIVE', 'RECRUITER'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        const updated = yield prisma_1.default.user.update({
            where: { id: req.params.id },
            data: { role }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// DELETE /api/admin/jobs/:id
router.delete('/jobs/:id', auth_1.authenticate, authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.default.job.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// DELETE /api/admin/posts/:id
router.delete('/posts/:id', auth_1.authenticate, authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.default.post.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// DELETE /api/admin/communities/:id
router.delete('/communities/:id', auth_1.authenticate, authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.default.community.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/admin/reports
router.get('/reports', auth_1.authenticate, authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reports = yield prisma_1.default.report.findMany({
            include: { reporter: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reports);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/admin/reports/:id/resolve
router.post('/reports/:id/resolve', auth_1.authenticate, authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updated = yield prisma_1.default.report.update({
            where: { id: req.params.id },
            data: { status: 'RESOLVED' }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
