import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { errorHandler } from './middleware/error';
import routes from './routes';

const app = express();

// Caddy + Cloudflare sit in front of this in production. With trust proxy
// enabled, req.ip resolves to the X-Forwarded-For client IP rather than the
// edge proxy, so rate-limit + audit-log records reflect the real origin.
app.set('trust proxy', 1);

// Browser origins permitted by CORS. Comma-separated list; empty in test/dev
// produces an empty allowlist (only same-origin / no-Origin requests work).
// Mobile, curl, and server-to-server callers send no Origin and are always
// allowed through.
const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS: origin not allowed'));
    },
    credentials: true,
  }),
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'ekonaryn-api', docs: '/api/v1' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ekonaryn-api' });
});

app.use('/api/v1', routes);

app.use(errorHandler);

export default app;
