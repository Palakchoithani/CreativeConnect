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
// Middleware to authorize Recruiters only
const authorizeRecruiter = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'RECRUITER') {
        return res.status(403).json({ error: 'Forbidden: Recruiters only' });
    }
    next();
};
// GET /api/recruiter/company
router.get('/company', auth_1.authenticate, authorizeRecruiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const company = yield prisma_1.default.company.findUnique({
            where: { recruiterId: req.user.userId }
        });
        res.json(company || null);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/recruiter/company
router.post('/company', auth_1.authenticate, authorizeRecruiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, website, logo, banner } = req.body;
        const company = yield prisma_1.default.company.upsert({
            where: { recruiterId: req.user.userId },
            update: { name, description, website, logo, banner },
            create: { recruiterId: req.user.userId, name, description, website, logo, banner }
        });
        res.json(company);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// GET /api/recruiter/jobs
router.get('/jobs', auth_1.authenticate, authorizeRecruiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jobs = yield prisma_1.default.job.findMany({
            where: { posterId: req.user.userId },
            include: {
                applications: {
                    include: {
                        applicant: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profile: { select: { bio: true, avatarUrl: true } }
                            }
                        },
                        portfolio: {
                            select: {
                                id: true,
                                title: true,
                                coverImage: true,
                                discipline: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(jobs);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/recruiter/applications/:appId/status
router.post('/applications/:appId/status', auth_1.authenticate, authorizeRecruiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.body; // SHORTLISTED, REJECTED, etc.
        const { appId } = req.params;
        const application = yield prisma_1.default.jobApplication.update({
            where: { id: appId },
            data: { status },
            include: { job: true }
        });
        // Send status alert notification to candidate
        yield prisma_1.default.notification.create({
            data: {
                userId: application.applicantId,
                type: 'REQUEST',
                content: `Your application for ${application.job.title} has been marked: ${status}`,
                linkUrl: '/jobs'
            }
        });
        res.json(application);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/recruiter/interviews
router.post('/interviews', auth_1.authenticate, authorizeRecruiter, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { jobId, candidateId, date, linkUrl, notes } = req.body;
        const interview = yield prisma_1.default.interview.create({
            data: {
                jobId,
                recruiterId: req.user.userId,
                candidateId,
                date: new Date(date),
                linkUrl,
                notes
            },
            include: { job: true }
        });
        // Notify candidate
        yield prisma_1.default.notification.create({
            data: {
                userId: candidateId,
                type: 'REMINDER',
                content: `You have an interview scheduled for ${interview.job.title} on ${new Date(date).toLocaleDateString()}`,
                linkUrl: '/dashboard'
            }
        });
        res.json(interview);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
