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
// GET /api/portfolio-reviews/:portfolioId
router.get('/:portfolioId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reviews = yield prisma_1.default.portfolioReview.findMany({
            where: { portfolioId: req.params.portfolioId },
            include: {
                reviewer: { select: { name: true, profile: { select: { avatarUrl: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/portfolio-reviews/:portfolioId
router.post('/:portfolioId', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { portfolioId } = req.params;
        const { rating, content } = req.body;
        const review = yield prisma_1.default.portfolioReview.create({
            data: {
                portfolioId,
                reviewerId: req.user.userId,
                rating: parseInt(rating, 10),
                content
            }
        });
        // Notify portfolio owner
        const portfolio = yield prisma_1.default.portfolio.findUnique({ where: { id: portfolioId } });
        if (portfolio && portfolio.creatorId !== req.user.userId) {
            yield prisma_1.default.notification.create({
                data: {
                    userId: portfolio.creatorId,
                    type: 'COMMENT',
                    content: `New portfolio review left on project ${portfolio.title}`,
                    linkUrl: `/portfolio/${portfolioId}`
                }
            });
        }
        res.status(201).json(review);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/portfolio-reviews/:reviewId/helpful
router.post('/:reviewId/helpful', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reviewId } = req.params;
        const review = yield prisma_1.default.portfolioReview.update({
            where: { id: reviewId },
            data: { helpfulVotes: { increment: 1 } }
        });
        res.json(review);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
