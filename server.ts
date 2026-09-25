import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './backend/src/app';
import { env } from './backend/src/config/env';
import { logger } from './backend/src/utils/logger';
import { checkDatabaseConnection } from './backend/src/config/database';
import { startNotificationDispatcher } from './backend/src/modules/notifications/services/notification-dispatch.service';

async function startServer() {
  // Create Express app with all API routes and middleware
  const app = createApp();

  const isProd = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  // Vite middleware in dev; static file serving in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT, hmr: false },
      appType: 'spa',
    });

    // Intercept @vite/client to disable background WebSocket attempts on blocked port 24678
    app.use((req, res, next) => {
      const url = req.url || '';
      if (url === '/@vite/client' || url.startsWith('/@vite/client?')) {
        const originalWrite = res.write.bind(res);
        const originalEnd = res.end.bind(res);
        const chunks: Buffer[] = [];

        res.write = function (chunk: any, ...args: any[]) {
          if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          return true;
        } as any;

        res.end = function (chunk: any, ...args: any[]) {
          if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          let body = Buffer.concat(chunks).toString('utf-8');
          // Replace WebSocket connection and error reporting
          body = body.replace(
            /transport\.connect\(createHMRHandler\(handleMessage\)\);/g,
            '/* HMR connection disabled in dev container */'
          );
          body = body.replace(/console\.error\(\s*([`'"])\[vite\]/g, 'console.debug($1[vite]');
          body = body.replace(/console\.error\(\s*`\[vite\]/g, 'console.debug(`[vite]');
          res.setHeader('content-length', Buffer.byteLength(body));
          return (originalEnd as any).call(res, body, ...args);
        } as any;
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const dbHealthy = await checkDatabaseConnection();
  if (!dbHealthy && isProd) {
    logger.error('Production database is unavailable; refusing to start without persistent MySQL.');
    process.exit(1);
  }
  if (!dbHealthy) logger.warn('Starting with in-memory store for development/preview only.');

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`TECUMP Server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
    logger.info(`Health check: http://0.0.0.0:${PORT}/health`);
  });

  try {
    const stopDispatcher = startNotificationDispatcher(env.NOTIFICATION_DISPATCH_INTERVAL_MS || 30000);
    const shutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      stopDispatcher();
      server.close(() => process.exit(0));
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.warn({ err }, 'Notification dispatcher warning');
  }
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
