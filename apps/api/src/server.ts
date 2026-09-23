import { env } from './config/env.js';

import http from 'node:http';
import { createApp } from './app.js';
import { logger } from './lib/logger.js';
import { attachSocketServer } from './realtime/io.js';
import { startVisitWorker } from './jobs/startWorker.js';

const app = createApp();
const httpServer = http.createServer(app);
attachSocketServer(httpServer);

httpServer.listen(env.API_PORT, () => {
  logger.info(`API listening on :${env.API_PORT}`);
});

if (env.RUN_WORKER_INLINE) {
  startVisitWorker();
  logger.info('BullMQ worker started in-process (RUN_WORKER_INLINE=true)');
}
