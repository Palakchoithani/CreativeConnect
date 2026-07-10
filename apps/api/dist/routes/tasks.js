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
// GET /api/tasks/project/:projectId
router.get('/project/:projectId', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.params;
        // Validate project member
        const member = yield prisma_1.default.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: req.user.userId } }
        });
        if (!member)
            return res.status(403).json({ error: 'Not a member of this project' });
        const tasks = yield prisma_1.default.task.findMany({
            where: { projectId },
            include: { assignee: { select: { name: true, profile: { select: { avatarUrl: true } } } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/tasks/project/:projectId
router.post('/project/:projectId', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.params;
        const { title, description, assigneeId, dueDate } = req.body;
        const member = yield prisma_1.default.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: req.user.userId } }
        });
        if (!member)
            return res.status(403).json({ error: 'Not a member of this project' });
        const task = yield prisma_1.default.task.create({
            data: {
                projectId,
                title,
                description,
                assigneeId,
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });
        res.status(201).json(task);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/tasks/:taskId/status
router.post('/:taskId/status', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { taskId } = req.params;
        const { status } = req.body; // TODO, IN_PROGRESS, DONE
        const task = yield prisma_1.default.task.update({
            where: { id: taskId },
            data: { status }
        });
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
