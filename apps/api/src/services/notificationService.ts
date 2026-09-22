import { Prisma, type NotificationType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

/**
 * In-app notification persistence. Email/SMS providers and the Socket.IO push
 * are added in Phase 4 (`src/jobs`); this keeps Phase 3 endpoints functional
 * (a host inbox has something to read) without depending on the job queue yet.
 */
export async function notify(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
) {
  return prisma.notification.create({
    data: { userId, type, payload: payload as Prisma.InputJsonValue },
  });
}
