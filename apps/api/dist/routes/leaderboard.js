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
const router = (0, express_1.Router)();
// GET /api/leaderboard
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [creatives, projects, portfolios] = yield Promise.all([
            // Top creatives (based on profile metrics)
            prisma_1.default.user.findMany({
                where: { role: 'CREATIVE' },
                include: {
                    profile: { select: { avatarUrl: true, bio: true } },
                    portfolios: true
                },
                take: 10
            }),
            // Top collaborative projects
            prisma_1.default.project.findMany({
                include: { members: true },
                take: 5
            }),
            // Top liked portfolios
            prisma_1.default.portfolio.findMany({
                where: { deletedAt: null, visibility: 'PUBLIC' },
                include: { creator: { select: { name: true } } },
                orderBy: { likes: 'desc' },
                take: 5
            })
        ]);
        // Format creative rankings
        const rankings = creatives.map(u => {
            var _a;
            return ({
                id: u.id,
                name: u.name,
                avatarUrl: (_a = u.profile) === null || _a === void 0 ? void 0 : _a.avatarUrl,
                projectsCount: u.portfolios.length,
                likesCount: u.portfolios.reduce((acc, curr) => acc + curr.likes, 0)
            });
        }).sort((a, b) => b.likesCount - a.likesCount);
        res.json({
            creatives: rankings,
            projects,
            portfolios
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
