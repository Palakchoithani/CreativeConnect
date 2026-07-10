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
exports.authenticate = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../prisma"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_creative_connect';
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().optional(),
    role: zod_1.z.enum(['CREATIVE', 'RECRUITER', 'MENTOR']).optional().default('CREATIVE'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name, role } = registerSchema.parse(req.body);
        const existingUser = yield prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const passwordHash = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prisma_1.default.user.create({
            data: {
                email,
                passwordHash,
                name,
                role: role || 'CREATIVE',
                profile: {
                    create: {} // Create an empty profile by default
                }
            },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        yield prisma_1.default.user.update({
            where: { id: user.id },
            data: { refreshToken, lastLogin: new Date() }
        });
        res.status(201).json({ token, refreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = yield prisma_1.default.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const isValid = yield bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        yield prisma_1.default.user.update({
            where: { id: user.id },
            data: { refreshToken, lastLogin: new Date() }
        });
        res.json({ token, refreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/auth/refresh-token — Rotate expired JWT tokens
router.post('/refresh-token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(400).json({ error: 'Refresh token is required' });
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, JWT_SECRET);
        const user = yield prisma_1.default.user.findUnique({
            where: { id: decoded.userId }
        });
        if (!user || user.refreshToken !== refreshToken || !user.isActive) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        const newRefreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        yield prisma_1.default.user.update({
            where: { id: user.id },
            data: { refreshToken: newRefreshToken }
        });
        res.json({ token, refreshToken: newRefreshToken });
    }
    catch (err) {
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
}));
// POST /api/auth/verify-email
router.post('/verify-email', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ error: 'Email is required' });
    try {
        yield prisma_1.default.user.update({
            where: { email },
            data: { emailVerified: true, isVerified: true }
        });
        res.json({ message: 'Email verified successfully' });
    }
    catch (err) {
        res.status(400).json({ error: 'Failed to verify email' });
    }
}));
// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ error: 'Email is required' });
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { email } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // In production, send email with reset link. For now, log and return success.
        console.log(`Password reset requested for ${email}`);
        res.json({ message: 'Password reset link sent to your email' });
    }
    catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'Email and password are required' });
    try {
        const passwordHash = yield bcryptjs_1.default.hash(password, 10);
        yield prisma_1.default.user.update({
            where: { email },
            data: { passwordHash }
        });
        res.json({ message: 'Password reset successfully' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to reset password' });
    }
}));
// POST /api/auth/logout
router.post('/logout', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    if (!token)
        return res.status(400).json({ error: 'No authorization header' });
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (decoded === null || decoded === void 0 ? void 0 : decoded.userId) {
            yield prisma_1.default.user.update({
                where: { id: decoded.userId },
                data: { refreshToken: null }
            });
        }
        res.json({ message: 'Logged out successfully' });
    }
    catch (err) {
        res.status(500).json({ error: 'Logout failed' });
    }
}));
// GET /api/auth/me — Validate token and return current user
router.get('/me', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = yield prisma_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, name: true, role: true, isActive: true, emailVerified: true }
        });
        if (!user || !user.isActive)
            return res.status(401).json({ error: 'User not found or inactive' });
        res.json({ user });
    }
    catch (_b) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}));
const authenticate = (req, res, next) => {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};
exports.authenticate = authenticate;
exports.default = router;
