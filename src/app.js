import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import router from './routes/IndexRoutes.js';
import Logger from './utils/Logger.js';
import { apiLimiter } from './middleware/RateLimit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const logger = new Logger('app.js');

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' })); // For images

app.use(
  cors({
    origin: '*', // Adjust this to your specific frontend domains in production for better security
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // required to send/receive cookies
  })
);

app.disable('x-powered-by');

// Webhook raw body middleware MUST be before body parsers for this route
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieParser(process.env.COOKIE_SECRET || 'cookie_secret_school_saas_prod')
);
app.use(compression());

// Apply rate limiter to all api routes
app.use('/api', apiLimiter);

// Use specific max-age for static assets (1 year for hashed files in prod)
const CACHE_MAX_AGE = 31536000000; // 1 Year in ms

app.use(
  express.static(path.join(__dirname, '../public'), {
    maxAge: CACHE_MAX_AGE,
    immutable: true,
  })
);
app.use(
  '/api/images',
  express.static(path.join(__dirname, '../public/uploads'), {
    maxAge: CACHE_MAX_AGE,
  })
);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,auth');
  next();
});

// Logger for route calls
app.use((req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationMs = duration[0] * 1000 + duration[1] / 1e6;
    const logMessage = `Route called: ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Duration: ${durationMs.toFixed(2)} ms`;
    logger.info(logMessage);
  });
  next();
});

app.use('/api', router);
app.set('views', path.join(__dirname, 'views'));

export default app;
