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
// GET /api/events
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const events = yield prisma_1.default.event.findMany({
            include: {
                host: { select: { name: true, profile: { select: { avatarUrl: true } } } },
                registrations: true
            },
            orderBy: { date: 'asc' }
        });
        res.json(events);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/events/:id
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const event = yield prisma_1.default.event.findUnique({
            where: { id: req.params.id },
            include: {
                host: { select: { name: true, profile: { select: { avatarUrl: true } } } },
                registrations: { include: { user: { select: { name: true, profile: { select: { avatarUrl: true } } } } } }
            }
        });
        if (!event)
            return res.status(404).json({ error: 'Event not found' });
        res.json(event);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/events
router.post('/', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, speaker, date, venue, liveLink, capacity } = req.body;
        const event = yield prisma_1.default.event.create({
            data: {
                title,
                description,
                speaker,
                date: new Date(date),
                venue,
                liveLink,
                capacity: parseInt(capacity, 10),
                hostId: req.user.userId
            }
        });
        res.status(201).json(event);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/events/:id/register
router.post('/:id/register', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = req.params.id;
        const userId = req.user.userId;
        const existing = yield prisma_1.default.eventRegistration.findUnique({
            where: { eventId_userId: { eventId, userId } }
        });
        if (existing)
            return res.status(400).json({ error: 'Already registered' });
        const registration = yield prisma_1.default.eventRegistration.create({
            data: { eventId, userId, status: 'REGISTERED' }
        });
        res.status(201).json(registration);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/events/:id/cancel
router.post('/:id/cancel', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = req.params.id;
        const userId = req.user.userId;
        const existing = yield prisma_1.default.eventRegistration.findUnique({
            where: { eventId_userId: { eventId, userId } }
        });
        if (!existing)
            return res.status(400).json({ error: 'Not registered' });
        yield prisma_1.default.eventRegistration.delete({ where: { id: existing.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
