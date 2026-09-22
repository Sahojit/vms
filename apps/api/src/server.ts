import { env } from './config/env.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from './lib/logger.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.WEB_URL, credentials: true }));
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = req.headers['x-request-id']?.toString() ?? randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use('/api/v1', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.API_PORT, () => {
  logger.info(`API listening on :${env.API_PORT}`);
});
