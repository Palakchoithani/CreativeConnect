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
// GET /api/challenges
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const challenges = yield prisma_1.default.challenge.findMany({
            include: { entries: true },
            orderBy: { deadline: 'asc' }
        });
        res.json(challenges);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/challenges/:id
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const challenge = yield prisma_1.default.challenge.findUnique({
            where: { id: req.params.id },
            include: {
                entries: {
                    include: { user: { select: { name: true, profile: { select: { avatarUrl: true } } } } },
                    orderBy: { votes: 'desc' }
                }
            }
        });
        if (!challenge)
            return res.status(404).json({ error: 'Challenge not found' });
        res.json(challenge);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/challenges
router.post('/', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { theme, description, deadline, rules, rewards, judges, badgeName } = req.body;
        const challenge = yield prisma_1.default.challenge.create({
            data: {
                theme,
                description,
                deadline: new Date(deadline),
                rules,
                rewards,
                judges,
                badgeName
            }
        });
        res.status(201).json(challenge);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/challenges/:id/entries
router.post('/:id/entries', auth_1.authenticate, upload.single('media'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const challengeId = req.params.id;
        const { title, description } = req.body;
        let mediaUrl = null;
        if (req.file) {
            mediaUrl = yield (0, storage_1.uploadFile)('challenges', `entry-${Date.now()}`, req.file.buffer, req.file.mimetype);
        }
        const entry = yield prisma_1.default.challengeEntry.create({
            data: {
                challengeId,
                userId: req.user.userId,
                title,
                description,
                mediaUrl
            }
        });
        res.status(201).json(entry);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/challenges/entries/:entryId/vote
router.post('/entries/:entryId/vote', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { entryId } = req.params;
        // Quick increment
        const entry = yield prisma_1.default.challengeEntry.update({
            where: { id: entryId },
            data: { votes: { increment: 1 } }
        });
        res.json(entry);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
