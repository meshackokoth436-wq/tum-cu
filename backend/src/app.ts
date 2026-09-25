import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';

import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { checkDatabaseConnection } from './config/database';

import authRoutes from './modules/authentication/routes/auth.routes';
import membershipRoutes from './modules/membership/routes/membership.routes';
import meetingsRoutes from './modules/meetings/routes/meetings.routes';
import expensesRoutes from './modules/expenses/routes/expenses.routes';
import eventsRoutes from './modules/events/routes/events.routes';
import ministriesRoutes from './modules/ministries/routes/ministries.routes';
import ministryMembersRoutes from './modules/ministry-members/routes/ministry-members.routes';
import adminRoutes from './modules/admin/routes/admin.routes';
import attendanceRoutes from './modules/attendance/routes/attendance.routes';
import prayerRequestsRoutes from './modules/prayer-requests/routes/prayer-requests.routes';
import notificationsRoutes from './modules/notifications/routes/notifications.routes';
import electionsRoutes from './modules/elections/routes/elections.routes';
import sermonsRoutes from './modules/sermons/routes/sermons.routes';
import programmesRoutes from './modules/programmes/routes/programmes.routes';
import geminiRoutes from './modules/gemini/routes/gemini.routes';
import landingMediaRoutes from './modules/landing-media/landing-media.routes';
import libraryRoutes from './modules/library/library.routes';
import galleryRoutes from './modules/gallery/gallery.routes';
import eteamsRoutes from './modules/e-teams/e-teams.routes';
import * as generatedModules from './modules/_generated/index';

export function createApp() {
  const app = express();

  // Behind Nginx/a load balancer in production — needed for req.ip and
  // rate-limiting to see the real client IP rather than the proxy's.
  app.set('trust proxy', 1);

  // --- Security & core middleware (Chapter 28 / 69) -----------------------
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      frameguard: false,
      hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
    })
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '8mb' }));
  app.use(express.urlencoded({ limit: '8mb', extended: true }));
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'public/uploads')));
  app.use('/community', express.static(path.resolve(process.cwd(), 'public/community')));
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

  // General API rate limit.
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Tighter limit specifically on authentication endpoints — these are the
  // targets of credential stuffing / brute force, so they get a much lower
  // ceiling than general API traffic regardless of the global limit above.
  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many failed authentication attempts. Please try again later.',
      data: null,
      errors: [{ code: 'RATE_LIMITED', message: 'Too many authentication attempts' }],
      meta: {},
    },
  });

  // --- Health / readiness / liveness (Chapter 39) --------------------------
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.get('/health/ready', async (_req, res) => {
    const dbHealthy = await checkDatabaseConnection();
    res
      .status(dbHealthy ? 200 : 503)
      .json({ status: dbHealthy ? 'ready' : 'not_ready', database: dbHealthy });
  });

  app.get('/health/live', (_req, res) => res.status(200).json({ status: 'alive' }));

  // --- API routes -----------------------------------------------------------
  const api = express.Router();
  api.use('/auth', authRateLimiter, authRoutes);
  api.use('/membership', membershipRoutes);
  api.use('/leadership', generatedModules.leadershipRoutes);
  api.use('/committees', generatedModules.committeesRoutes);
  api.use('/committee-members', generatedModules.committeeMembersRoutes);
  api.use('/ministries', ministriesRoutes);
  api.use('/ministry-members', ministryMembersRoutes);
  api.use('/admin', adminRoutes);
  api.use('/meetings', meetingsRoutes);
  api.use('/attendance', attendanceRoutes);
  api.use('/events', eventsRoutes);
  api.use('/prayer-requests', prayerRequestsRoutes);
  api.use('/notifications', notificationsRoutes);
  api.use('/bible-study-groups', generatedModules.bibleStudyGroupsRoutes);
  api.use('/mentorship-groups', generatedModules.mentorshipGroupsRoutes);
  api.use('/evangelism-teams', eteamsRoutes);
  api.use('/e-teams', eteamsRoutes);
  api.use('/income', generatedModules.incomeRoutes);
  api.use('/expenses', expensesRoutes);
  api.use('/welfare-cases', generatedModules.welfareCasesRoutes);
  api.use('/assets', generatedModules.assetsRoutes);
  api.use('/library-resources', libraryRoutes);
  api.use('/library', libraryRoutes);
  api.use('/gallery', galleryRoutes);
  api.use('/broadcast-messages', generatedModules.broadcastMessagesRoutes);
  api.use('/elections', electionsRoutes);
  api.use('/sermons', sermonsRoutes);
  api.use('/programmes', programmesRoutes);
  api.use('/gemini', geminiRoutes);
  api.use('/landing-media', landingMediaRoutes);
  api.use('/admin/landing-media', landingMediaRoutes);
  api.use('/reports', generatedModules.reportsRoutes);
  api.use('/audit-logs', generatedModules.auditLogsRoutes);

  app.use(env.API_PREFIX, api);
  if (env.API_PREFIX !== '/api') {
    app.use('/api', api);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
