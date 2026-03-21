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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieParser(process.env.COOKIE_SECRET || 'cookie_secret_school_saas_prod')
);
app.use(compression());

// Apply rate limiter to all api routes
app.use('/api', apiLimiter);

app.use(express.static(path.join(__dirname, '../public')));
app.use(
  '/api/images',
  express.static(path.join(__dirname, '../public/uploads'))
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
    const logMessage = `Route called: ${req.method} ${req.path} | Status: ${res.statusCode} | Duration: ${durationMs.toFixed(2)} ms`;
    logger.info(logMessage);
  });
  next();
});

app.use('/api', router);
app.set('views', path.join(__dirname, 'views'));

export default app;
