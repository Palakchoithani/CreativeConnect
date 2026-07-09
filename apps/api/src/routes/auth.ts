import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_creative_connect';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(['CREATIVE', 'RECRUITER', 'MENTOR']).optional().default('CREATIVE'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
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

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, lastLogin: new Date() }
    });

    res.status(201).json({ token, refreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, lastLogin: new Date() }
    });

    res.json({ token, refreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/refresh-token — Rotate expired JWT tokens
router.post('/refresh-token', async (req: any, res: any) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required' });

  try {
    const decoded: any = jwt.verify(refreshToken, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.refreshToken !== refreshToken || !user.isActive) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    const newRefreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });

    res.json({ token, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req: any, res: any) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true, isVerified: true }
    });
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to verify email' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: any, res: any) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // In production, send email with reset link. For now, log and return success.
    console.log(`Password reset requested for ${email}`);
    res.json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: any, res: any) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    });
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: any, res: any) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(400).json({ error: 'No authorization header' });

  try {
    const decoded: any = jwt.decode(token);
    if (decoded?.userId) {
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { refreshToken: null }
      });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me — Validate token and return current user
router.get('/me', async (req: any, res: any) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true, emailVerified: true }
    });
    if (!user || !user.isActive) return res.status(401).json({ error: 'User not found or inactive' });
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export const authenticate = (req: any, res: any, next: any) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

export default router;
