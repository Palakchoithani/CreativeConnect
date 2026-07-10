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
// GET /api/search?q=query
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const q = (req.query.q || '').trim();
        if (!q) {
            return res.json({
                users: [],
                portfolios: [],
                jobs: [],
                projects: []
            });
        }
        const [users, portfolios, jobs, projects] = yield Promise.all([
            // Search Users (Creatives)
            prisma_1.default.user.findMany({
                where: {
                    role: 'CREATIVE',
                    OR: [
                        { name: { contains: q } },
                        { email: { contains: q } },
                        {
                            profile: {
                                OR: [
                                    { bio: { contains: q } },
                                    { location: { contains: q } },
                                    { skills: { contains: q } }
                                ]
                            }
                        }
                    ]
                },
                include: {
                    profile: {
                        select: {
                            avatarUrl: true,
                            bio: true,
                            location: true,
                            skills: true
                        }
                    }
                },
                take: 20
            }),
            // Search Portfolios
            prisma_1.default.portfolio.findMany({
                where: {
                    deletedAt: null,
                    visibility: 'PUBLIC',
                    OR: [
                        { title: { contains: q } },
                        { subtitle: { contains: q } },
                        { description: { contains: q } },
                        { category: { contains: q } },
                        { tags: { contains: q } }
                    ]
                },
                include: {
                    creator: {
                        select: {
                            name: true,
                            profile: {
                                select: {
                                    avatarUrl: true
                                }
                            }
                        }
                    }
                },
                take: 20
            }),
            // Search Jobs
            prisma_1.default.job.findMany({
                where: {
                    OR: [
                        { title: { contains: q } },
                        { company: { contains: q } },
                        { description: { contains: q } },
                        { location: { contains: q } }
                    ]
                },
                take: 20
            }),
            // Search Collaborations
            prisma_1.default.project.findMany({
                where: {
                    OR: [
                        { title: { contains: q } },
                        { description: { contains: q } }
                    ]
                },
                include: {
                    owner: {
                        select: {
                            name: true,
                            profile: {
                                select: {
                                    avatarUrl: true
                                }
                            }
                        }
                    }
                },
                take: 20
            })
        ]);
        res.json({
            users,
            portfolios,
            jobs,
            projects
        });
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
