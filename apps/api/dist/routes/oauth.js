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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_creative_connect';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
// Configurable client IDs and secrets via .env, with developer-friendly defaults
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'placeholder-google-id';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'placeholder-google-secret';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'placeholder-github-id';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'placeholder-github-secret';
// Redirect to Google OAuth Consent Page
router.get('/google', (req, res) => {
    const host = req.get('host');
    const protocol = (host === null || host === void 0 ? void 0 : host.includes('azurewebsites.net')) ? 'https' : req.protocol;
    const redirectUri = `${protocol}://${host}/api/auth/oauth/google/callback`;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile%20email`;
    res.redirect(url);
});
// Google callback
router.get('/google/callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.query;
    if (!code)
        return res.redirect(`${FRONTEND_URL}/login?error=OAuth code missing`);
    try {
        const host = req.get('host');
        const protocol = (host === null || host === void 0 ? void 0 : host.includes('azurewebsites.net')) ? 'https' : req.protocol;
        const redirectUri = `${protocol}://${host}/api/auth/oauth/google/callback`;
        // Simulate exchange with Google token endpoint (to keep it integration-ready without crashing)
        // If the client credentials are placeholders, we'll bypass external calls to allow testing
        let email = 'student.google@creativeconnect.edu';
        let name = 'Creative Google Student';
        let id = 'google-12345';
        if (GOOGLE_CLIENT_ID !== 'placeholder-google-id') {
            const tokenRes = yield fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code: code,
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code',
                }),
            });
            const tokens = yield tokenRes.json();
            if (tokens.access_token) {
                const userRes = yield fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { Authorization: `Bearer ${tokens.access_token}` },
                });
                const googleUser = yield userRes.json();
                email = googleUser.email;
                name = googleUser.name || googleUser.given_name || 'Google User';
                id = googleUser.id;
            }
        }
        // Upsert user in database
        let user = yield prisma_1.default.user.findFirst({
            where: {
                OR: [
                    { email },
                    { oAuthProvider: 'GOOGLE', oAuthProviderId: id }
                ]
            }
        });
        if (!user) {
            user = yield prisma_1.default.user.create({
                data: {
                    email,
                    name,
                    role: 'CREATIVE',
                    oAuthProvider: 'GOOGLE',
                    oAuthProviderId: id,
                    emailVerified: true,
                    isVerified: true,
                    profile: { create: {} }
                }
            });
        }
        else if (!user.oAuthProvider) {
            user = yield prisma_1.default.user.update({
                where: { id: user.id },
                data: { oAuthProvider: 'GOOGLE', oAuthProviderId: id, emailVerified: true, isVerified: true }
            });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        yield prisma_1.default.user.update({
            where: { id: user.id },
            data: { refreshToken, lastLogin: new Date() }
        });
        res.redirect(`${FRONTEND_URL}/login?token=${token}&refreshToken=${refreshToken}`);
    }
    catch (err) {
        console.error('Google OAuth callback error:', err);
        res.redirect(`${FRONTEND_URL}/login?error=OAuth authentication failed`);
    }
}));
// Redirect to GitHub OAuth Page
router.get('/github', (req, res) => {
    const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email`;
    res.redirect(url);
});
// GitHub callback
router.get('/github/callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { code } = req.query;
    if (!code)
        return res.redirect(`${FRONTEND_URL}/login?error=OAuth code missing`);
    try {
        let email = 'student.github@creativeconnect.edu';
        let name = 'Creative GitHub Student';
        let id = 'github-12345';
        if (GITHUB_CLIENT_ID !== 'placeholder-github-id') {
            const tokenRes = yield fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    client_id: GITHUB_CLIENT_ID,
                    client_secret: GITHUB_CLIENT_SECRET,
                    code,
                }),
            });
            const tokens = yield tokenRes.json();
            if (tokens.access_token) {
                const userRes = yield fetch('https://api.github.com/user', {
                    headers: { Authorization: `Bearer ${tokens.access_token}` },
                });
                const githubUser = yield userRes.json();
                // Fetch primary email
                const emailsRes = yield fetch('https://api.github.com/user/emails', {
                    headers: { Authorization: `Bearer ${tokens.access_token}` },
                });
                const emails = yield emailsRes.json();
                const primaryEmail = (_a = emails.find((e) => e.primary)) === null || _a === void 0 ? void 0 : _a.email;
                email = primaryEmail || githubUser.email || `${githubUser.login}@github.com`;
                name = githubUser.name || githubUser.login || 'GitHub User';
                id = String(githubUser.id);
            }
        }
        let user = yield prisma_1.default.user.findFirst({
            where: {
                OR: [
                    { email },
                    { oAuthProvider: 'GITHUB', oAuthProviderId: id }
                ]
            }
        });
        if (!user) {
            user = yield prisma_1.default.user.create({
                data: {
                    email,
                    name,
                    role: 'CREATIVE',
                    oAuthProvider: 'GITHUB',
                    oAuthProviderId: id,
                    emailVerified: true,
                    isVerified: true,
                    profile: { create: {} }
                }
            });
        }
        else if (!user.oAuthProvider) {
            user = yield prisma_1.default.user.update({
                where: { id: user.id },
                data: { oAuthProvider: 'GITHUB', oAuthProviderId: id, emailVerified: true, isVerified: true }
            });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        yield prisma_1.default.user.update({
            where: { id: user.id },
            data: { refreshToken, lastLogin: new Date() }
        });
        res.redirect(`${FRONTEND_URL}/login?token=${token}&refreshToken=${refreshToken}`);
    }
    catch (err) {
        console.error('GitHub OAuth callback error:', err);
        res.redirect(`${FRONTEND_URL}/login?error=OAuth authentication failed`);
    }
}));
exports.default = router;
