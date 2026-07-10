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
const jobSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    company: zod_1.z.string().min(1),
    location: zod_1.z.string().optional(),
    type: zod_1.z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE']).default('FULL_TIME'),
    salary: zod_1.z.string().optional(),
    description: zod_1.z.string().min(10),
});
// Get all jobs
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jobs = yield prisma_1.default.job.findMany({
            include: {
                poster: { select: { name: true, profile: { select: { avatarUrl: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(jobs);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get single job
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const job = yield prisma_1.default.job.findUnique({
            where: { id: req.params.id },
            include: {
                poster: { select: { name: true, profile: { select: { avatarUrl: true, bio: true } } } },
                applications: {
                    select: { applicantId: true, status: true }
                }
            }
        });
        if (!job)
            return res.status(404).json({ error: 'Job not found' });
        res.json(job);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Create job
router.post('/', authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = jobSchema.parse(req.body);
        const job = yield prisma_1.default.job.create({
            data: Object.assign(Object.assign({}, data), { posterId: req.user.userId })
        });
        res.status(201).json(job);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Apply to job
router.post('/:id/apply', authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jobId = req.params.id;
        const applicantId = req.user.userId;
        const existingApplication = yield prisma_1.default.jobApplication.findUnique({
            where: { jobId_applicantId: { jobId, applicantId } }
        });
        if (existingApplication) {
            return res.status(400).json({ error: 'You have already applied to this job' });
        }
        const latestPortfolio = yield prisma_1.default.portfolio.findFirst({
            where: { creatorId: applicantId, deletedAt: null },
            orderBy: { createdAt: 'desc' }
        });
        const application = yield prisma_1.default.jobApplication.create({
            data: {
                jobId,
                applicantId,
                portfolioId: latestPortfolio ? latestPortfolio.id : null
            }
        });
        res.status(201).json(application);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get my applications
router.get('/me/applications', authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const applications = yield prisma_1.default.jobApplication.findMany({
            where: { applicantId: req.user.userId },
            include: {
                job: {
                    select: { title: true, company: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // Format to match frontend expectations
        const formattedApps = applications.map(app => (Object.assign(Object.assign({}, app), { jobTitle: app.job.title, company: app.job.company })));
        res.json(formattedApps);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
