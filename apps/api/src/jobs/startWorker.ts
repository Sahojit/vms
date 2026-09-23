import { Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { processVisitJob } from './handlers.js';

/**
 * Starts the BullMQ consumer for the "visits" queue (expire-visit, expire-pending,
 * overstay-check). Called from the standalone worker process (`src/worker.ts`, for hosts that
 * support a separate background-worker process) and, as a fallback, from `src/server.ts` itself
 * on platforms whose free tier only allows one process type (e.g. Render) — see
 * docs/decisions.md for why both entry points exist.
 */
export function startVisitWorker(): Worker {
  const worker = new Worker('visits', processVisitJob, {
    connection: redis,
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id, name: job.name }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, name: job?.name, err }, 'Job failed');
  });

  return worker;
}
