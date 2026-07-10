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
const projectSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().min(10),
    repoUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    liveUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
});
// Get all projects
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projects = yield prisma_1.default.project.findMany({
            include: {
                owner: { select: { name: true, profile: { select: { avatarUrl: true } } } },
                members: { include: { user: { select: { name: true, profile: { select: { avatarUrl: true } } } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(projects);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get single project
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield prisma_1.default.project.findUnique({
            where: { id: req.params.id },
            include: {
                owner: { select: { name: true, profile: { select: { avatarUrl: true } } } },
                members: { include: { user: { select: { id: true, name: true, profile: { select: { avatarUrl: true, bio: true } } } } } }
            }
        });
        if (!project)
            return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Create project
router.post('/', authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = projectSchema.parse(req.body);
        const project = yield prisma_1.default.project.create({
            data: Object.assign(Object.assign({}, data), { ownerId: req.user.userId, members: {
                    create: {
                        userId: req.user.userId,
                        role: 'OWNER'
                    }
                } })
        });
        res.status(201).json(project);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Join project (Request or direct add - simplified to direct join for MVP)
router.post('/:id/join', authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.params.id;
        const userId = req.user.userId;
        const existingMember = yield prisma_1.default.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId } }
        });
        if (existingMember) {
            return res.status(400).json({ error: 'You are already a member of this project' });
        }
        const member = yield prisma_1.default.projectMember.create({
            data: {
                projectId,
                userId,
                role: 'MEMBER'
            }
        });
        res.status(201).json(member);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
