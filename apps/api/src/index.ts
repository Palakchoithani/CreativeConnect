import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
import profileRoutes from './routes/profile';
import portfolioRoutes from './routes/portfolio';
import connectionRoutes from './routes/connection';
import feedRoutes from './routes/feed';
import jobsRoutes from './routes/jobs';
import projectsRoutes from './routes/projects';
import mentorshipRoutes from './routes/mentorship';
import usersRoutes from './routes/users';
import searchRoutes from './routes/search';
import communityRoutes from './routes/communities';
import discussionRoutes from './routes/discussions';
import challengeRoutes from './routes/challenges';
import eventRoutes from './routes/events';
import portfolioReviewRoutes from './routes/portfolio-reviews';
import leaderboardRoutes from './routes/leaderboard';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import recruiterRoutes from './routes/recruiter';
import taskRoutes from './routes/tasks';
import messagesRoutes from './routes/messages';

app.use('/api/auth/oauth', oauthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/connection', connectionRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/portfolio-reviews', portfolioReviewRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messagesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CreativeConnect API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
