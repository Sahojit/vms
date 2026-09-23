import { env } from './config/env.js';

import { logger } from './lib/logger.js';
import { startVisitWorker } from './jobs/startWorker.js';

startVisitWorker();

logger.info(`Worker started (env=${env.NODE_ENV}), listening on queue "visits"`);
