import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import * as visitService from '../services/visitService.js';

export async function pending(req: AuthedRequest, res: Response) {
  const visits = await visitService.pendingForHost(req.user!.sub);
  res.json({ visits });
}

export async function history(req: AuthedRequest, res: Response) {
  const visits = await visitService.historyForHost(req.user!.sub);
  res.json({ visits });
}
