import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import knowledgeRoutes from './routes/knowledge';

const app = express();

// ─── Security middleware ────────────────────────────────────────

app.use(helmet());

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

// ─── Rate limiting (production) ─────────────────────────────────

if (config.nodeEnv === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later' },
  });

  app.use(limiter);
}

// ─── Routes ─────────────────────────────────────────────────────

app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/knowledge', knowledgeRoutes);

// ─── Health check ───────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    notionConfigured: !!(config.notionApiKey && config.notionDatabaseIds.policies),
    anthropicConfigured: !!config.anthropicApiKey,
  });
});

// ─── Error handling middleware ───────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);

  if (config.nodeEnv === 'development') {
    console.error(err.stack);
  }

  res.status(500).json({
    success: false,
    error:
      config.nodeEnv === 'production'
        ? 'Internal server error'
        : err.message,
  });
});

// ─── Start server ───────────────────────────────────────────────

app.listen(config.port, () => {
  console.log(`LRG Tax Copilot API running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
  console.log(`Notion configured: ${!!(config.notionApiKey && config.notionDatabaseIds.policies)}`);
  console.log(`Anthropic configured: ${!!config.anthropicApiKey}`);
});

export default app;
