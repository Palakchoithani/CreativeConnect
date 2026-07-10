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
// Follow a user / Send connection request (toggle)
router.post('/:followingId', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const followerId = req.user.userId;
        const { followingId } = req.params;
        if (followerId === followingId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }
        // Check if already following
        const existing = yield prisma_1.default.connection.findUnique({
            where: { followerId_followingId: { followerId, followingId } }
        });
        if (existing) {
            // Unfollow
            yield prisma_1.default.connection.delete({ where: { id: existing.id } });
            return res.json({ following: false, message: 'Unfollowed' });
        }
        const connection = yield prisma_1.default.connection.create({
            data: { followerId, followingId, status: 'ACCEPTED' }
        });
        res.status(201).json({ following: true, connection });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get my connections / followers
router.get('/', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const [following, followers] = yield Promise.all([
            prisma_1.default.connection.findMany({
                where: { followerId: userId },
                include: { following: { select: { id: true, name: true, profile: { select: { avatarUrl: true, bio: true } } } } }
            }),
            prisma_1.default.connection.findMany({
                where: { followingId: userId },
                include: { follower: { select: { id: true, name: true, profile: { select: { avatarUrl: true, bio: true } } } } }
            })
        ]);
        res.json({ following, followers });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get connections of ANY specific user
router.get('/user/:userId/list', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const [following, followers] = yield Promise.all([
            prisma_1.default.connection.findMany({
                where: { followerId: userId, status: 'ACCEPTED' },
                include: { following: { select: { id: true, name: true, profile: { select: { avatarUrl: true, bio: true } } } } }
            }),
            prisma_1.default.connection.findMany({
                where: { followingId: userId, status: 'ACCEPTED' },
                include: { follower: { select: { id: true, name: true, profile: { select: { avatarUrl: true, bio: true } } } } }
            })
        ]);
        res.json({ following, followers });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Check follow status between current user and another user
router.get('/status/:targetId', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const followerId = req.user.userId;
        const { targetId } = req.params;
        const connection = yield prisma_1.default.connection.findUnique({
            where: { followerId_followingId: { followerId, followingId: targetId } }
        });
        res.json({ following: !!connection });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Accept a connection request
router.put('/:connectionId/accept', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const connection = yield prisma_1.default.connection.update({
            where: { id: req.params.connectionId },
            data: { status: 'ACCEPTED' }
        });
        res.json(connection);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
